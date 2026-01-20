import { Injectable } from '@angular/core';

import { supabase } from '../data/supabase.client';
import { CacheService } from './cache.service';
import type { FruverData, RangoHistorico } from '../models/fruver-data.model';
import { formatYearMonth, groupBy, median, percentChange } from '../utils/stats';

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
  fechaInicio: string; // último periodo global
};

// La información es casi estática: cache de 1 hora
const TTL_1H = 60 * 60 * 1000;

const PAGE_SIZE = 5000;

@Injectable({ providedIn: 'root' })
export class FruverDataService {
  constructor(private readonly cache: CacheService) {}

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
      }>;

      console.log('[FruverData] Productos cargados:', rows.length);

      return rows
        .map((r) => ({
          producto: r.producto,
          grupo_alimentos: r.grupo_alimentos ?? 'desconocido',
          codigo_grupo: Number(r.codigo_grupo ?? 0),
          precioActual: r.precio_medio,
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
   * Obtiene datos del último periodo para un producto.
   */
  async getUltimoPeriodo(producto: string): Promise<ProductoPeriodo> {
    const p = producto.toLowerCase();
    const key = `producto:${p}:ultimoPeriodo`;

    return this.cache.cached(key, TTL_1H, async () => {
      const { data: fechas, error: fechaError } = await supabase
        .from('fruver_data')
        .select('fecha_inicio,fecha_final')
        .eq('producto', p)
        .order('fecha_inicio', { ascending: false })
        .limit(1);

      if (fechaError) throw fechaError;
      const fechaInicio = fechas?.[0]?.fecha_inicio;
      const fechaFinal = fechas?.[0]?.fecha_final;
      if (!fechaInicio || !fechaFinal) return { fechaInicio: '', fechaFinal: '', rows: [] };

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
   */
  async getPeriodoAnterior(producto: string): Promise<ProductoPeriodo> {
    const p = producto.toLowerCase();
    const key = `producto:${p}:periodoAnterior`;

    return this.cache.cached(key, TTL_1H, async () => {
      const { data: fechas, error: fechaError } = await supabase
        .from('fruver_data')
        .select('fecha_inicio,fecha_final')
        .eq('producto', p)
        .order('fecha_inicio', { ascending: false })
        .limit(2);

      if (fechaError) throw fechaError;
      const fechaInicio = fechas?.[1]?.fecha_inicio;
      const fechaFinal = fechas?.[1]?.fecha_final;
      if (!fechaInicio || !fechaFinal) return { fechaInicio: '', fechaFinal: '', rows: [] };

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
}

