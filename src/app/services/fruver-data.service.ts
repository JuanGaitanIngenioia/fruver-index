import { Injectable } from '@angular/core';

import { supabase } from '../data/supabase.client';
import { CacheService } from './cache.service';
import type { FruverData, RangoHistorico } from '../models/fruver-data.model';
import { formatYearMonth, groupBy, median } from '../utils/stats';

export type ProductoPeriodo = {
  fechaInicio: string;
  fechaFinal: string;
  rows: FruverData[];
};

export type SeriePoint = { label: string; value: number };
export type FechasGlobales = { actual: string; anterior: string | null };

export type CatalogoItem = {
  producto: string;
  grupo_alimentos: string;
  codigo_grupo: number;
  precioActual: number;
  precioAnterior: number | null;
  cambioPct: number | null;
  tendenciaScore: number; // -100..100 aprox
};

export type CatalogoBasicoItem = {
  producto: string;
  grupo_alimentos: string;
  codigo_grupo: number;
  precioActual: number; // mediana nacional del último periodo global
  precioAnterior: number | null; // precio del periodo anterior
  cambioPct: number | null; // cambio porcentual entre periodos
  fechaInicio: string; // último periodo global
};

// La información es casi estática: cache de 1 hora
const TTL_1H = 60 * 60 * 1000;

const PAGE_SIZE = 5000;

@Injectable({ providedIn: 'root' })
export class FruverDataService {
  constructor(private readonly cache: CacheService) {}

  private parseISODate(iso: string): Date | null {
    // iso expected: YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const dt = new Date(Date.UTC(year, month, day));
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  private formatISODateUTC(dt: Date): string {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private async canastaTotalEnFecha(productosLower: string[], fechaInicio: string): Promise<number> {
    const { data, error } = await supabase
      .from('fruver_data')
      .select('producto,precio_medio')
      .in('producto', productosLower)
      .eq('fecha_inicio', fechaInicio)
      .limit(50000);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ producto: string; precio_medio: number }>;
    const byProd = groupBy(rows, (r) => r.producto);
    let total = 0;
    for (const prod of productosLower) {
      const valores = (byProd[prod] ?? []).map((r) => r.precio_medio).filter((n) => Number.isFinite(n) && n > 0);
      if (valores.length === 0) continue;
      total += median(valores);
    }
    return Math.round(total);
  }

  private async fetchAll<T>(
    loader: (from: number, to: number) => Promise<T[]>
  ): Promise<T[]> {
    const out: T[] = [];
    for (let page = 0; page < 500; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const chunk = await loader(from, to);
      out.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
    }
    return out;
  }

  /**
   * Última fecha (periodo) global disponible.
   */
  async getFechaGlobalActual(): Promise<string> {
    const key = 'fechas:global:actual';
    return this.cache.cached(key, TTL_1H, async () => {
      const { data, error } = await supabase
        .from('fruver_data')
        .select('fecha_inicio')
        .order('fecha_inicio', { ascending: false })
        .limit(1);

      if (error) throw error;
      return (data?.[0]?.fecha_inicio ?? '') as string;
    });
  }

  /**
   * Catálogo liviano para cargar la app rápido usando RPC con DISTINCT ON:
   * - producto
   * - categoría (grupo_alimentos / codigo_grupo)
   * - último precio medio del producto
   *
   * Requiere crear la función get_productos_catalogo() en Supabase.
   * Se cachea 1 hora.
   */
  async getCatalogoBasico(): Promise<CatalogoBasicoItem[]> {
    const key = 'catalogo:basico';
    return this.cache.cached(key, TTL_1H, async () => {
      console.log('[FruverData] Cargando catálogo con DISTINCT ON...');

      const { data, error } = await supabase.rpc('get_productos_catalogo');

      if (error) {
        console.error('[FruverData] Error en RPC:', error);
        throw error;
      }

      const rows = (data ?? []) as Array<{
        producto: string;
        precio_medio: number;
        grupo_alimentos: string;
        codigo_grupo: number;
        fecha_inicio: string;
        precio_anterior: number | null;
        cambio_pct: number | null;
      }>;

      console.log('[FruverData] Productos cargados:', rows.length);

      return rows
        .map((r) => ({
          producto: r.producto,
          grupo_alimentos: r.grupo_alimentos ?? 'desconocido',
          codigo_grupo: Number(r.codigo_grupo ?? 0),
          precioActual: r.precio_medio,
          precioAnterior: r.precio_anterior ?? null,
          cambioPct: r.cambio_pct ?? null,
          fechaInicio: r.fecha_inicio ?? ''
        }))
        .sort((a, b) => a.producto.localeCompare(b.producto));
    });
  }

  /**
   * Lista de productos únicos.
   */
  async getProductosDistinct(): Promise<string[]> {
    const key = 'productos:distinct';
    return this.cache.cached(key, TTL_1H, async () => {
      const items = await this.getCatalogoBasico();
      return items.map((x) => x.producto);
    });
  }

  /**
   * Obtiene las fechas distintas disponibles para un producto, ordenadas descendente.
   */
  private async getFechasDistintas(producto: string): Promise<Array<{ fecha_inicio: string; fecha_final: string }>> {
    const key = `producto:${producto}:fechasDistintas`;
    return this.cache.cached(key, TTL_1H, async () => {
      // Traer hasta 100 registros ordenados por fecha descendente y extraer fechas únicas
      const { data, error } = await supabase
        .from('fruver_data')
        .select('fecha_inicio,fecha_final')
        .eq('producto', producto)
        .order('fecha_inicio', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Extraer fechas únicas (YYYY-MM-DD como texto se ordena correctamente)
      const fechasMap = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.fecha_inicio && !fechasMap.has(row.fecha_inicio)) {
          fechasMap.set(row.fecha_inicio, row.fecha_final ?? row.fecha_inicio);
        }
      }

      // Ordenar por fecha_inicio descendente
      return Array.from(fechasMap.entries())
        .map(([fecha_inicio, fecha_final]) => ({ fecha_inicio, fecha_final }))
        .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
    });
  }

  /**
   * Obtiene datos del último periodo para un producto.
   * El periodo A (actual) es el último registro disponible.
   */
  async getUltimoPeriodo(producto: string): Promise<ProductoPeriodo> {
    const p = producto.toLowerCase();
    const key = `producto:${p}:ultimoPeriodo`;

    return this.cache.cached(key, TTL_1H, async () => {
      const fechas = await this.getFechasDistintas(p);
      if (fechas.length === 0) return { fechaInicio: '', fechaFinal: '', rows: [] };

      const { fecha_inicio: fechaInicio, fecha_final: fechaFinal } = fechas[0];

      const rows = await this.fetchAll<FruverData>(async (from, to) => {
        const { data, error } = await supabase
          .from('fruver_data')
          .select('*')
          .eq('producto', p)
          .eq('fecha_inicio', fechaInicio)
          .order('ciudad', { ascending: true })
          .range(from, to);

        if (error) throw error;
        return (data ?? []) as FruverData[];
      });

      return { fechaInicio, fechaFinal, rows };
    });
  }

  /**
   * Obtiene datos del periodo anterior para un producto.
   * El periodo B (anterior) es el inmediatamente anterior al último.
   */
  async getPeriodoAnterior(producto: string): Promise<ProductoPeriodo> {
    const p = producto.toLowerCase();
    const key = `producto:${p}:periodoAnterior`;

    return this.cache.cached(key, TTL_1H, async () => {
      const fechas = await this.getFechasDistintas(p);
      if (fechas.length < 2) return { fechaInicio: '', fechaFinal: '', rows: [] };

      const { fecha_inicio: fechaInicio, fecha_final: fechaFinal } = fechas[1];

      const rows = await this.fetchAll<FruverData>(async (from, to) => {
        const { data, error } = await supabase
          .from('fruver_data')
          .select('*')
          .eq('producto', p)
          .eq('fecha_inicio', fechaInicio)
          .order('ciudad', { ascending: true })
          .range(from, to);

        if (error) throw error;
        return (data ?? []) as FruverData[];
      });

      return { fechaInicio, fechaFinal, rows };
    });
  }

  /**
   * Serie histórica de un producto.
   */
  async getSerieHistorica(producto: string, rango: RangoHistorico): Promise<SeriePoint[]> {
    const p = producto.toLowerCase();
    const key = `producto:${p}:serie:${rango}`;

    return this.cache.cached(key, TTL_1H, async () => {
      // Heurística de cantidad de filas a traer (la tabla es semanal; hay muchas filas por semana por mercados)
      const limit =
        rango === '1 mes' ? 20 : rango === '6 meses' ? 60 : rango === '1 año' ? 80 : 400;

      const { data, error } = await supabase
        .from('fruver_data')
        .select('fecha_inicio,precio_medio')
        .eq('producto', p)
        .order('fecha_inicio', { ascending: false })
        .limit(limit * 50);

      if (error) throw error;
      const rows = (data ?? []) as Array<{ fecha_inicio: string; precio_medio: number }>;

      const byWeek = groupBy(rows, (r) => r.fecha_inicio);
      const weeklyPoints = Object.keys(byWeek)
        .sort((a, b) => a.localeCompare(b))
        .map((fecha) => ({
          label: fecha,
          value: median(byWeek[fecha].map((x) => x.precio_medio).filter(Number.isFinite))
        }));

      if (rango !== 'max') {
        const target =
          rango === '1 mes' ? 4 : rango === '6 meses' ? 26 : rango === '1 año' ? 52 : weeklyPoints.length;
        return weeklyPoints.slice(-target);
      }

      const byMonth = groupBy(weeklyPoints, (pnt) => formatYearMonth(pnt.label));
      const monthly = Object.keys(byMonth)
        .sort((a, b) => a.localeCompare(b))
        .map((month) => ({
          label: month,
          value: median(byMonth[month].map((x) => x.value).filter(Number.isFinite))
        }));

      return monthly.slice(-60);
    });
  }

  /**
   * Productos del mismo grupo alimenticio.
   */
  async getProductosMismoGrupo(
    codigoGrupo: number,
    fechaInicio: string
  ): Promise<Array<{ producto: string; precio_medio: number }>> {
    const key = `grupo:${codigoGrupo}:fecha:${fechaInicio}`;
    return this.cache.cached(key, TTL_1H, async () => {
      const rows = await this.fetchAll<Array<{ producto: string; precio_medio: number }>[number]>(async (from, to) => {
        const { data, error } = await supabase
          .from('fruver_data')
          .select('producto,precio_medio')
          .eq('codigo_grupo', codigoGrupo)
          .eq('fecha_inicio', fechaInicio)
          .order('producto', { ascending: true })
          .range(from, to);

        if (error) throw error;
        return (data ?? []) as Array<{ producto: string; precio_medio: number }>;
      });

      return rows;
    });
  }

  /**
   * Calcula el valor actual de la canasta familiar sumando los precios de los productos especificados.
   * Omite productos que no existen en la BD.
   */
  async getCanastaActual(productosCanasta: string[]): Promise<{
    valorTotal: number;
    productosEncontrados: number;
    productosUsados: string[];
    fechaInicio: string;
  }> {
    // Key corta para evitar ruido/strings enormes en cache/logs
    const key = `canasta:actual`;
    return this.cache.cached(key, TTL_1H, async () => {
      const fechaActual = await this.getFechaGlobalActual();
      if (!fechaActual) {
        return { valorTotal: 0, productosEncontrados: 0, productosUsados: [], fechaInicio: '' };
      }

      const productosLower = productosCanasta.map((p) => p.toLowerCase().trim());
      const precios: number[] = [];
      const usados: string[] = [];

      // Consultar en bloque para reducir llamadas
      const { data, error } = await supabase
        .from('fruver_data')
        .select('producto,precio_medio')
        .in('producto', productosLower)
        .eq('fecha_inicio', fechaActual)
        .limit(50000);

      if (error) throw error;
      const rows = (data ?? []) as Array<{ producto: string; precio_medio: number }>;

      const byProducto = groupBy(rows, (r) => r.producto);
      for (const producto of productosLower) {
        const preciosProducto = (byProducto[producto] ?? [])
          .map((r) => r.precio_medio)
          .filter((p) => Number.isFinite(p) && p > 0);
        if (preciosProducto.length === 0) continue;
        usados.push(producto);
        precios.push(median(preciosProducto));
      }

      const valorTotal = precios.reduce((sum, precio) => sum + precio, 0);

      return {
        valorTotal,
        productosEncontrados: precios.length,
        productosUsados: usados,
        fechaInicio: fechaActual
      };
    });
  }

  /**
   * Obtiene todas las fechas distintas disponibles en la base de datos.
   */
  private async getFechasGlobalesDisponibles(): Promise<string[]> {
    const key = 'fechas:globales:todas';
    return this.cache.cached(key, TTL_1H, async () => {
      // Obtener todas las fechas distintas de la tabla
      const { data, error } = await supabase
        .from('fruver_data')
        .select('fecha_inicio')
        .order('fecha_inicio', { ascending: true })
        .limit(10000);

      if (error) throw error;

      const fechasSet = new Set<string>();
      for (const row of (data ?? []) as Array<{ fecha_inicio: string }>) {
        if (row.fecha_inicio) {
          fechasSet.add(row.fecha_inicio);
        }
      }

      const fechas = Array.from(fechasSet).sort((a, b) => a.localeCompare(b));
      console.log(`[FruverData] Fechas globales disponibles: ${fechas.length}`, fechas.slice(-5));
      return fechas;
    });
  }

  /**
   * Serie semanal real de la canasta (suma de medianas por producto) para las últimas ~13 semanas.
   */
  async getCanastaSerieUltimasSemanas(productosCanasta: string[], semanas = 13): Promise<SeriePoint[]> {
    // Cache key incluye cantidad de productos para diferenciarlo
    const productosLower = productosCanasta.map((p) => p.toLowerCase().trim()).filter(Boolean);
    const key = `canasta:serie:${semanas}:${productosLower.length}`;
    
    return this.cache.cached(key, TTL_1H, async () => {
      if (productosLower.length === 0) return [];

      // Obtener todas las fechas disponibles
      const todasFechas = await this.getFechasGlobalesDisponibles();
      
      if (todasFechas.length === 0) {
        console.warn('[FruverData] No hay fechas disponibles en la BD');
        return [];
      }

      // Tomar las últimas N semanas
      const fechas = todasFechas.slice(-semanas);
      console.log(`[FruverData] Cargando serie canasta para ${fechas.length} fechas:`, fechas);

      if (fechas.length === 0) return [];

      // Consultar precios para los productos en las fechas seleccionadas
      const { data, error } = await supabase
        .from('fruver_data')
        .select('fecha_inicio,producto,precio_medio')
        .in('producto', productosLower)
        .in('fecha_inicio', fechas)
        .limit(500000);

      if (error) throw error;

      const rows = (data ?? []) as Array<{ fecha_inicio: string; producto: string; precio_medio: number }>;
      console.log(`[FruverData] Filas cargadas para serie canasta: ${rows.length}`);

      const byFecha = groupBy(rows, (r) => r.fecha_inicio);

      const serie = fechas.map((fecha) => {
        const rowsFecha = byFecha[fecha] ?? [];
        const byProd = groupBy(rowsFecha, (r) => r.producto);
        let total = 0;
        for (const prod of productosLower) {
          const valores = (byProd[prod] ?? []).map((r) => r.precio_medio).filter((n) => Number.isFinite(n) && n > 0);
          if (valores.length === 0) continue;
          total += median(valores);
        }
        return { label: fecha, value: Math.round(total) };
      });

      // Filtrar puntos con valor 0 (no hay datos para esa fecha)
      return serie.filter((p) => p.value > 0);
    });
  }

  /**
   * Totales de canasta para 3 barras: Actual, Anterior, Hace dos meses.
   * Se calcula usando el último corte disponible de cada mes.
   */
  async getCanastaBarrasTresMeses(productosCanasta: string[]): Promise<{
    labels: ['Actual', 'Anterior', 'Hace dos meses'];
    values: [number, number, number];
    fechas: [string | null, string | null, string | null];
  }> {
    const key = 'canasta:barras:3m';
    return this.cache.cached(key, TTL_1H, async () => {
      const productosLower = productosCanasta.map((p) => p.toLowerCase().trim()).filter(Boolean);
      if (productosLower.length === 0) {
        return { labels: ['Actual', 'Anterior', 'Hace dos meses'], values: [0, 0, 0], fechas: [null, null, null] };
      }

      // Traer fechas globales (distinct) y quedarnos con las más recientes por mes
      const { data: fechasData, error: fechasError } = await supabase
        .from('fruver_data')
        .select('fecha_inicio')
        .order('fecha_inicio', { ascending: false })
        .limit(2500);
      if (fechasError) throw fechasError;

      const fechas = Array.from(
        new Set(((fechasData ?? []) as Array<{ fecha_inicio: string }>).map((r) => r.fecha_inicio).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      if (fechas.length === 0) {
        return { labels: ['Actual', 'Anterior', 'Hace dos meses'], values: [0, 0, 0], fechas: [null, null, null] };
      }

      // Tomar el último día disponible como "Actual"
      const actualFecha = fechas[fechas.length - 1];
      const actualDt = this.parseISODate(actualFecha);
      if (!actualDt) {
        return { labels: ['Actual', 'Anterior', 'Hace dos meses'], values: [0, 0, 0], fechas: [actualFecha, null, null] };
      }

      // Helper: último corte disponible para un mes dado (YYYY-MM)
      const lastCorteForYearMonth = (ym: string): string | null => {
        // fechas está ordenado ascendente; buscamos desde el final
        for (let i = fechas.length - 1; i >= 0; i--) {
          const f = fechas[i];
          if (f.startsWith(ym)) return f;
        }
        return null;
      };

      const ymActual = actualFecha.slice(0, 7);
      const dtAnterior = new Date(Date.UTC(actualDt.getUTCFullYear(), actualDt.getUTCMonth() - 1, 1));
      const dtHaceDos = new Date(Date.UTC(actualDt.getUTCFullYear(), actualDt.getUTCMonth() - 2, 1));
      const ymAnterior = `${dtAnterior.getUTCFullYear()}-${String(dtAnterior.getUTCMonth() + 1).padStart(2, '0')}`;
      const ymHaceDos = `${dtHaceDos.getUTCFullYear()}-${String(dtHaceDos.getUTCMonth() + 1).padStart(2, '0')}`;

      const fechaAnterior = lastCorteForYearMonth(ymAnterior);
      const fechaHaceDos = lastCorteForYearMonth(ymHaceDos);

      const actual = await this.canastaTotalEnFecha(productosLower, actualFecha);
      const anterior = fechaAnterior ? await this.canastaTotalEnFecha(productosLower, fechaAnterior) : 0;
      const haceDos = fechaHaceDos ? await this.canastaTotalEnFecha(productosLower, fechaHaceDos) : 0;

      return {
        labels: ['Actual', 'Anterior', 'Hace dos meses'],
        values: [actual, anterior, haceDos],
        fechas: [actualFecha, fechaAnterior, fechaHaceDos]
      };
    });
  }
}

