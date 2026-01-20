import { Injectable } from '@angular/core';

import type { FruverData, Tendencia } from '../models/fruver-data.model';
import { tendenciaValue } from '../models/fruver-data.model';
import { average, median, stdDev } from '../utils/stats';

export type IndicadoresResultado = {
  ipcAgro: number; // %
  disparidadRegionalCv: number; // %
  friccionSpread: number; // ratio
  scoreTendencia: number; // -100..100
  volatilidad: number; // stddev de variaciones %
};

@Injectable({ providedIn: 'root' })
export class IndicadoresService {
  calcularIPCAgro(precioActual: number, precioAnterior: number): number {
    if (!precioAnterior) return 0;
    return ((precioActual / precioAnterior) - 1) * 100;
  }

  calcularDisparidadRegional(precios: number[]): number {
    const mu = average(precios);
    if (!mu) return 0;
    const sigma = stdDev(precios);
    return (sigma / mu) * 100;
  }

  calcularFriccionMercado(precioMaximo: number, precioMinimo: number, precioMedio: number): number {
    if (!precioMedio) return 0;
    if (precioMaximo < precioMinimo) return 0;
    return (precioMaximo - precioMinimo) / precioMedio;
  }

  calcularScoreTendencia(tendencias: Tendencia[]): number {
    if (tendencias.length === 0) return 0;
    const score = tendencias.reduce((acc, t) => acc + tendenciaValue(t), 0);
    const maxScore = tendencias.length * 3;
    return maxScore ? (score / maxScore) * 100 : 0;
  }

  calcularVolatilidadHistorica(preciosOrdenados: number[]): number {
    if (preciosOrdenados.length < 3) return 0;
    const variaciones: number[] = [];
    for (let i = 1; i < preciosOrdenados.length; i++) {
      const prev = preciosOrdenados[i - 1];
      const curr = preciosOrdenados[i];
      if (!prev) continue;
      variaciones.push(((curr - prev) / prev) * 100);
    }
    if (variaciones.length < 2) return 0;
    return stdDev(variaciones);
  }

  /**
   * Calcula KPIs agregados a nivel “nacional” (medianas entre mercados).
   */
  calcularTodosIndicadores(datosActuales: FruverData[], datosAnteriores: FruverData[]): IndicadoresResultado {
    const preciosAct = datosActuales.map((d) => d.precio_medio).filter(Number.isFinite);
    const preciosPrev = datosAnteriores.map((d) => d.precio_medio).filter(Number.isFinite);

    const medAct = median(preciosAct);
    const medPrev = median(preciosPrev);

    const ipcAgro = this.calcularIPCAgro(medAct, medPrev);

    // Disparidad: usamos mediana por ciudad y calculamos CV entre ciudades.
    const preciosPorCiudad = new Map<string, number[]>();
    for (const row of datosActuales) {
      const key = row.ciudad ?? 'desconocido';
      const arr = preciosPorCiudad.get(key) ?? [];
      arr.push(row.precio_medio);
      preciosPorCiudad.set(key, arr);
    }
    const medianasCiudad = Array.from(preciosPorCiudad.values()).map((arr) =>
      median(arr.filter(Number.isFinite))
    );
    const disparidadRegionalCv = this.calcularDisparidadRegional(medianasCiudad);

    // Fricción (spread): agregamos usando min/max nacional y mediana nacional.
    const precioMin = Math.min(...datosActuales.map((d) => d.precio_minimo).filter(Number.isFinite));
    const precioMax = Math.max(...datosActuales.map((d) => d.precio_maximo).filter(Number.isFinite));
    const friccionSpread = this.calcularFriccionMercado(precioMax, precioMin, medAct);

    const tendencias = datosActuales.map((d) => d.tendencia ?? null);
    const scoreTendencia = this.calcularScoreTendencia(tendencias as Tendencia[]);

    // Volatilidad: se calcula en la vista usando la serie histórica; aquí dejamos 0.
    const volatilidad = 0;

    return { ipcAgro, disparidadRegionalCv, friccionSpread, scoreTendencia, volatilidad };
  }
}

