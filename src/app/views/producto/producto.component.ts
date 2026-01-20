import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Chart, type ChartConfiguration } from 'chart.js/auto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { FruverData, RangoHistorico } from '../../models/fruver-data.model';
import { FruverDataService } from '../../services/fruver-data.service';
import { IndicadoresService } from '../../services/indicadores.service';
import { VariablesNegocioService } from '../../services/variables-negocio.service';
import { groupBy, median } from '../../utils/stats';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss'
})
export class ProductoComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly data = inject(FruverDataService);
  private readonly indicadoresService = inject(IndicadoresService);
  private readonly variablesService = inject(VariablesNegocioService);

  readonly ranges: RangoHistorico[] = ['1 mes', '6 meses', '1 año', 'max'];

  readonly producto = signal<string>('');
  readonly range = signal<RangoHistorico>('1 mes');

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly periodoActual = signal<Awaited<ReturnType<FruverDataService['getUltimoPeriodo']>> | null>(null);
  readonly periodoAnterior = signal<Awaited<ReturnType<FruverDataService['getPeriodoAnterior']>> | null>(null);
  readonly serie = signal<Awaited<ReturnType<FruverDataService['getSerieHistorica']>>>([]);

  readonly volatilidad = signal<number>(0);
  readonly indicadores = signal<ReturnType<IndicadoresService['calcularTodosIndicadores']> | null>(null);
  readonly variables = signal<ReturnType<VariablesNegocioService['calcularVariables']> | null>(null);
  readonly sustitucion = signal<ReturnType<VariablesNegocioService['calcularSustitucion']> | null>(null);

  readonly titulo = computed(() => {
    const p = this.producto();
    return p ? `Detalle del producto: ${p}` : 'Detalle del producto';
  });

  readonly tablaMercadoPeriodo = computed(() => {
    const actual = this.periodoActual()?.rows ?? [];
    const prev = this.periodoAnterior()?.rows ?? [];

    const keyFn = (r: { nombre_mercado: string; ciudad: string }) =>
      `${r.nombre_mercado ?? 'desconocido'} · ${r.ciudad ?? 'desconocido'}`;

    const agg = (rows: typeof actual) => {
      const by = groupBy(rows, keyFn);
      const out = new Map<string, number>();
      for (const key of Object.keys(by)) {
        out.set(key, median(by[key].map((x) => x.precio_medio).filter(Number.isFinite)));
      }
      return out;
    };

    const a = agg(actual);
    const b = agg(prev);

    const keys = Array.from(new Set([...a.keys(), ...b.keys()]));
    return keys
      .map((k) => ({
        market: k,
        periodA: a.get(k) ?? null,
        periodB: b.get(k) ?? null
      }))
      .sort((x, y) => (x.periodA ?? Number.POSITIVE_INFINITY) - (y.periodA ?? Number.POSITIVE_INFINITY))
      .slice(0, 12);
  });

  readonly precioNacionalActual = computed(() => {
    const rows = this.periodoActual()?.rows ?? [];
    return median(rows.map((r) => r.precio_medio).filter(Number.isFinite));
  });

  readonly fechaActual = computed(() => this.periodoActual()?.fechaInicio ?? '');
  readonly fechaAnterior = computed(() => this.periodoAnterior()?.fechaInicio ?? '');

  // Helpers para formateo seguro de indicadores
  
  /**
   * Formatea un porcentaje mostrando solo el valor absoluto (sin signo).
   * El signo se muestra con getTrendIcon.
   */
  formatPct(value: number | undefined | null, decimals = 2): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';
    return `${Math.abs(value).toFixed(decimals)}%`;
  }

  /**
   * Formatea un porcentaje con signo explícito (+/-)
   */
  formatPctSigned(value: number | undefined | null, decimals = 2): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }

  formatNumber(value: number | undefined | null, decimals = 1): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';
    return value.toFixed(decimals);
  }

  getTrendClass(value: number | undefined | null, threshold = 0.05): 'up' | 'down' | 'neutral' {
    if (value === undefined || value === null || !Number.isFinite(value)) return 'neutral';
    if (value > threshold) return 'up';
    if (value < -threshold) return 'down';
    return 'neutral';
  }

  getTrendIcon(value: number | undefined | null, threshold = 0.05): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '=';
    if (value > threshold) return '+';
    if (value < -threshold) return '-';
    return '=';
  }

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const producto = (params.get('producto') ?? '').toLowerCase().trim();
      this.producto.set(producto);
      this.reload();
    });
  }

  setRange(r: RangoHistorico): void {
    if (this.range() === r) return;
    this.range.set(r);
    void this.loadSerieAndRecalc();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.periodoActual.set(null);
    this.periodoAnterior.set(null);
    this.serie.set([]);
    this.indicadores.set(null);
    this.variables.set(null);
    this.sustitucion.set(null);

    try {
      const producto = this.producto();
      if (!producto) throw new Error('Producto inválido.');

      const [actual, anterior] = await Promise.all([
        this.data.getUltimoPeriodo(producto),
        this.data.getPeriodoAnterior(producto)
      ]);

      this.periodoActual.set(actual);
      this.periodoAnterior.set(anterior);

      // Importante: el canvas del chart solo existe cuando loading() es false.
      // Si intentamos renderizar mientras loading=true, renderChart() no encuentra el canvas.
      this.loading.set(false);
      await this.loadSerieAndRecalc();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error cargando datos.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadSerieAndRecalc(): Promise<void> {
    const producto = this.producto();
    const rango = this.range();

    const serie = await this.data.getSerieHistorica(producto, rango);
    this.serie.set(serie);

    const serieValues = serie.map((p) => p.value).filter(Number.isFinite);
    const vol = this.indicadoresService.calcularVolatilidadHistorica(serieValues);
    this.volatilidad.set(vol);

    const actualRows = this.periodoActual()?.rows ?? [];
    const prevRows = this.periodoAnterior()?.rows ?? [];
    const indicadores = this.indicadoresService.calcularTodosIndicadores(actualRows, prevRows);
    indicadores.volatilidad = vol;
    this.indicadores.set(indicadores);

    const variables = this.variablesService.calcularVariables(
      actualRows,
      prevRows,
      serieValues,
      vol,
      indicadores.ipcAgro
    );
    this.variables.set(variables);

    await this.loadSustitucionIfPossible();
    this.renderChart();
  }

  private async loadSustitucionIfPossible(): Promise<void> {
    const actualRows = this.periodoActual()?.rows ?? [];
    const prevRows = this.periodoAnterior()?.rows ?? [];
    if (actualRows.length === 0 || prevRows.length === 0) return;

    const ref = actualRows[0];
    const producto = ref.producto;
    const precioActual = median(actualRows.map((r) => r.precio_medio).filter(Number.isFinite));
    const precioPrev = median(prevRows.map((r) => r.precio_medio).filter(Number.isFinite));

    const productoAgg: FruverData = {
      ...ref,
      precio_medio: precioActual
    };

    const [grupoActRaw, grupoPrevRaw] = await Promise.all([
      this.data.getProductosMismoGrupo(ref.codigo_grupo, this.periodoActual()!.fechaInicio),
      this.data.getProductosMismoGrupo(ref.codigo_grupo, this.periodoAnterior()!.fechaInicio)
    ]);

    const aggGrupo = (rows: Array<{ producto: string; precio_medio: number }>) => {
      const by = groupBy(rows, (r) => r.producto);
      return Object.keys(by).map((p) => ({
        producto: p,
        precio_medio: median(by[p].map((x) => x.precio_medio).filter(Number.isFinite))
      }));
    };

    const grupoAct = aggGrupo(grupoActRaw);
    const grupoPrev = new Map<string, number>();
    for (const item of aggGrupo(grupoPrevRaw)) grupoPrev.set(item.producto, item.precio_medio);

    const sust = this.variablesService.calcularSustitucion(productoAgg, precioPrev || null, grupoAct, grupoPrev);
    // Si el “producto actual” no es el mismo string (normalización), igual nos sirve.
    if (sust && sust.productoOriginal !== producto) sust.productoOriginal = producto;
    this.sustitucion.set(sust);
  }

  private renderChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const labels = this.serie().map((p) => p.label);
    const values = this.serie().map((p) => p.value);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Precio medio (mediana nacional)',
            data: values,
            borderColor: '#F28C28',
            backgroundColor: 'rgba(242, 140, 40, 0.12)',
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (items.length > 0) {
                  const index = items[0].dataIndex;
                  return labels[index] || '';
                }
                return '';
              },
              label: (ctx) => `Precio: $ ${Number(ctx.raw ?? 0).toLocaleString('es-CO')}`
            },
            displayColors: false,
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#F28C28',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => `$ ${Number(v).toLocaleString('es-CO')}`
            }
          }
        }
      }
    };

    this.chart?.destroy();
    this.chart = new Chart(canvas, config);
  }

  ngAfterViewInit(): void {
    // Si la serie ya cargó antes de que el canvas existiera, renderizar ahora.
    if (this.serie().length > 0) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}

