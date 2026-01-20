import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Chart, type ChartConfiguration } from 'chart.js/auto';

import type { CatalogoBasicoItem } from '../../services/fruver-data.service';
import { FruverDataService } from '../../services/fruver-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fruver = inject(FruverDataService);

  // Lista base de productos de la canasta familiar (se depura automáticamente con los que existan en BD)
  private readonly productosCanasta = signal<string[]>([
    // Verduras y Hortalizas
    'acelga', 'ajo', 'ahuyama', 'apio', 'arveja verde en vaina', 'berenjena', 'brócoli', 'calabaza',
    'cebolla cabezona blanca', 'cebolla cabezona roja', 'cebolla junca', 'chócolo (mazorca)', 'coliflor',
    'espinaca', 'fríjol verde (cargamanto)', 'habichuela', 'lechuga batavia', 'lechuga crespa',
    'pepino cohombro', 'pimentón', 'rábano rojo', 'remolacha', 'repollo blanco', 'repollo morado',
    'tomate chonto', 'tomate larga vida (milano)', 'tomate riogrande', 'zanahoria',
    // Frutas Frescas
    'aguacate común', 'aguacate hass', 'aguacate papelillo', 'banano criollo', 'banano urabá', 'coco',
    'curuba', 'fresa', 'granadilla', 'guayaba pera', 'limón común', 'limón tahití', 'lulo', 'mandarina',
    'mango común', 'mango tommy', 'manzana (importada y nacional)', 'maracuyá', 'melón', 'mora de castilla',
    'naranja valencia', 'naranja sweet', 'papaya maradol', 'pera', 'piña gold', 'piña perolera',
    'pitahaya', 'sandía', 'tomate de árbol', 'uva (isabela, red globe)',
    // Tubérculos, Raíces y Plátanos
    'arracacha amarilla', 'arracacha blanca', 'ñame diamante', 'ñame espino', 'papa criolla (amarilla)',
    'papa negra (capira)', 'papa parda pastusa', 'papa r-12', 'papa rubí', 'papa sabanera', 'papa suprema',
    'papa única', 'plátano guineo', 'plátano hartón maduro', 'plátano hartón verde', 'ulluco',
    'yuca chirosa', 'yuca llanera'
  ]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly productos = signal<CatalogoBasicoItem[]>([]);

  readonly searchQuery = signal('');
  readonly showSuggestions = signal(false);

  readonly canastaLoading = signal(true);
  readonly canastaError = signal<string | null>(null);
  readonly canastaValor = signal<number>(0);
  // Info interna (no se muestra en UI)
  readonly canastaInfo = signal<{ fechaInicio: string } | null>(null);

  readonly canastaBarras = signal<{ labels: string[]; values: number[] } | null>(null);

  @ViewChild('canastaChart', { static: false }) canastaChart?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  readonly sugerencias = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query || query.length < 2) return [];
    
    return this.productos()
      .filter((p) => p.producto.toLowerCase().includes(query))
      .slice(0, 8);
  });

  constructor() {
    void this.load();
    void this.loadCanasta();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.fruver.getCatalogoBasico();
      this.productos.set(data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCanasta(): Promise<void> {
    this.canastaLoading.set(true);
    this.canastaError.set(null);
    try {
      const resultado = await this.fruver.getCanastaActual(this.productosCanasta());
      this.canastaValor.set(resultado.valorTotal);
      this.canastaInfo.set({ fechaInicio: resultado.fechaInicio });

      // Depurar lista: quitar productos que no existen en BD (reduce ruido y evita “faltantes”)
      if (resultado.productosUsados.length > 0) {
        this.productosCanasta.set(resultado.productosUsados);
      }

      // Serie real: últimas ~13 semanas (≈3 meses)
      const barras = await this.fruver.getCanastaBarrasTresMeses(this.productosCanasta());
      this.canastaBarras.set({ labels: barras.labels, values: barras.values });
      setTimeout(() => this.renderCanastaChart(), 0);
    } catch (e) {
      this.canastaError.set(e instanceof Error ? e.message : 'No se pudo cargar la canasta.');
    } finally {
      this.canastaLoading.set(false);
    }
  }

  private renderCanastaChart(): void {
    const canvas = this.canastaChart?.nativeElement;
    if (!canvas || !this.canastaBarras()) return;

    const labels = this.canastaBarras()!.labels;
    const values = this.canastaBarras()!.values;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Valor de la canasta familiar',
            data: values,
            backgroundColor: ['rgba(45, 90, 39, 0.75)', 'rgba(45, 90, 39, 0.45)', 'rgba(45, 90, 39, 0.28)'],
            borderColor: ['#2D5A27', '#2D5A27', '#2D5A27'],
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 72
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Valor: $ ${Number(ctx.raw ?? 0).toLocaleString('es-CO')}`
            },
            displayColors: false,
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#2D5A27',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (v) => `$ ${Number(v).toLocaleString('es-CO')}`
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    };

    this.chart?.destroy();
    this.chart = new Chart(canvas, config);
  }

  ngAfterViewInit(): void {
    // Si ya tenemos datos, renderizar el gráfico
    if (this.canastaBarras()) {
      this.renderCanastaChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.showSuggestions.set(value.trim().length >= 2);
  }

  buscar(raw: string): void {
    const producto = (raw ?? '').toLowerCase().trim();
    if (!producto) return;
    this.showSuggestions.set(false);
    this.router.navigate(['/producto', producto]);
  }

  seleccionarProducto(producto: CatalogoBasicoItem): void {
    this.showSuggestions.set(false);
    this.searchQuery.set(producto.producto);
    this.router.navigate(['/producto', producto.producto.toLowerCase()]);
  }

  ocultarSugerencias(): void {
    // Pequeño delay para permitir click en sugerencia
    setTimeout(() => this.showSuggestions.set(false), 150);
  }
}
