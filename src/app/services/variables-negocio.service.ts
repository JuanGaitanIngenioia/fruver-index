import { Injectable } from '@angular/core';

import type { FruverData, Tendencia } from '../models/fruver-data.model';
import { tendenciaValue } from '../models/fruver-data.model';
import { average, median, percentChange } from '../utils/stats';

export interface IndiceEstabilidadCompra {
  valor: number; // 1..5
  estrellas: string;
  descripcion: string;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
}

export interface VelocidadTendencia {
  velocidad: number; // -3..3 aprox (diferencia)
  tendenciaActual: Tendencia;
  tendenciaAnterior: Tendencia;
  cambio:
    | 'Aceleración Fuerte'
    | 'Aceleración Moderada'
    | 'Estable'
    | 'Desaceleración Moderada'
    | 'Desaceleración Fuerte';
  recomendacion: 'Acumular' | 'Mantener' | 'Liquidar';
}

export interface MargenArbitraje {
  margenBruto: number;
  margenNeto: number;
  precioBogota: number;
  precioPromedioNacional: number;
  costoTransporteEstimado: number;
  recomendacion: 'Alto' | 'Medio' | 'Bajo' | 'No Recomendado';
}

export type AlertaPrecio = 'Compra Fuerte' | 'Venta Fuerte' | 'Estable' | 'Monitorear';

export interface CostoReposicion {
  precioMaximo: number;
  ipcAgroSemanal: number;
  precioReposicion: number;
  margenSeguridad: number;
  recomendacion: string;
}

export interface Sustitucion {
  productoOriginal: string;
  productoAlternativo: string;
  precioOriginal: number;
  precioAlternativo: number;
  ahorroPorcentual: number;
  grupoAlimentos: string;
  recomendacion: string;
}

export interface DistanciaMediaPrecios {
  precioLocal: number;
  precioNacional: number;
  diferencia: number;
  diferenciaPorcentual: number;
  estado: 'Sobrevalorado' | 'Subvalorado' | 'Alineado';
}

export interface VariablesNegocioResultado {
  estabilidadCompra: IndiceEstabilidadCompra;
  velocidadTendencia: VelocidadTendencia;
  margenArbitrajeBogota?: MargenArbitraje;
  alerta: AlertaPrecio;
  costoReposicion: CostoReposicion;
  sustitucion?: Sustitucion | null;
  precioProyectado7d?: number;
  distanciaMedia?: DistanciaMediaPrecios;
}

function tendenciaFromNumeric(value: number): Tendencia {
  if (value >= 2.5) return '+++';
  if (value >= 1.5) return '++';
  if (value >= 0.5) return '+';
  if (value <= -2.5) return '---';
  if (value <= -1.5) return '--';
  if (value <= -0.5) return '-';
  return null;
}

@Injectable({ providedIn: 'root' })
export class VariablesNegocioService {
  calcularIndiceEstabilidadCompra(precioMaximo: number, precioMinimo: number, precioMedio: number): IndiceEstabilidadCompra {
    const spread = precioMedio ? (precioMaximo - precioMinimo) / precioMedio : 0;

    if (spread <= 0.1) return { valor: 5, estrellas: '⭐⭐⭐⭐⭐', descripcion: 'Precio Fijo', riesgo: 'Bajo' };
    if (spread <= 0.2) return { valor: 4, estrellas: '⭐⭐⭐⭐', descripcion: 'Estable', riesgo: 'Bajo' };
    if (spread <= 0.4) return { valor: 3, estrellas: '⭐⭐⭐', descripcion: 'Moderado', riesgo: 'Medio' };
    if (spread <= 0.6) return { valor: 2, estrellas: '⭐⭐', descripcion: 'Variable', riesgo: 'Medio' };
    return { valor: 1, estrellas: '⭐', descripcion: 'Mucho regateo/Riesgo', riesgo: 'Alto' };
  }

  calcularVelocidadTendencia(tendenciaActual: Tendencia, tendenciaAnterior: Tendencia): VelocidadTendencia {
    const valorActual = tendenciaValue(tendenciaActual);
    const valorAnterior = tendenciaValue(tendenciaAnterior);
    const velocidad = valorActual - valorAnterior;

    let cambio: VelocidadTendencia['cambio'];
    let recomendacion: VelocidadTendencia['recomendacion'];

    if (velocidad >= 2) {
      cambio = 'Aceleración Fuerte';
      recomendacion = 'Acumular';
    } else if (velocidad >= 1) {
      cambio = 'Aceleración Moderada';
      recomendacion = 'Acumular';
    } else if (velocidad === 0) {
      cambio = 'Estable';
      recomendacion = 'Mantener';
    } else if (velocidad >= -1) {
      cambio = 'Desaceleración Moderada';
      recomendacion = 'Mantener';
    } else {
      cambio = 'Desaceleración Fuerte';
      recomendacion = 'Liquidar';
    }

    return { velocidad, tendenciaActual, tendenciaAnterior, cambio, recomendacion };
  }

  calcularMargenArbitrajeBogota(
    precioBogota: number,
    precioPromedioNacional: number,
    costoTransportePorcentual: number = 15
  ): MargenArbitraje {
    if (!precioPromedioNacional || precioBogota <= precioPromedioNacional) {
      return {
        margenBruto: 0,
        margenNeto: 0,
        precioBogota,
        precioPromedioNacional,
        costoTransporteEstimado: costoTransportePorcentual,
        recomendacion: 'No Recomendado'
      };
    }

    const margenBruto = ((precioBogota - precioPromedioNacional) / precioPromedioNacional) * 100;
    const margenNeto = margenBruto - costoTransportePorcentual;

    let recomendacion: MargenArbitraje['recomendacion'];
    if (margenNeto > 25) recomendacion = 'Alto';
    else if (margenNeto > 15) recomendacion = 'Medio';
    else if (margenNeto > 5) recomendacion = 'Bajo';
    else recomendacion = 'No Recomendado';

    return {
      margenBruto,
      margenNeto,
      precioBogota,
      precioPromedioNacional,
      costoTransporteEstimado: costoTransportePorcentual,
      recomendacion
    };
  }

  calcularAlertaPrecio(tendencia: Tendencia, velocidadTendencia: number, volatilidad: number): AlertaPrecio {
    const valorTendencia = tendenciaValue(tendencia);

    if (valorTendencia <= -2 && velocidadTendencia <= -1) return 'Compra Fuerte';
    if (valorTendencia >= 2 && velocidadTendencia >= 1) return 'Venta Fuerte';
    if (valorTendencia === 0 && volatilidad < 10) return 'Estable';
    return 'Monitorear';
  }

  calcularCostoRealReposicion(
    precioMaximo: number,
    ipcAgroSemanal: number,
    margenSeguridad: number = 10
  ): CostoReposicion {
    const inflacionProyectada = ipcAgroSemanal * 4;
    const precioReposicion = precioMaximo * (1 + inflacionProyectada / 100) * (1 + margenSeguridad / 100);

    let recomendacion = 'Estable. Puede mantener precios actuales.';
    if (inflacionProyectada > 20) recomendacion = 'Alta volatilidad. Considerar ajustar precios del menú.';
    else if (inflacionProyectada > 10) recomendacion = 'Moderada volatilidad. Monitorear semanalmente.';

    return {
      precioMaximo,
      ipcAgroSemanal,
      precioReposicion: Math.round(precioReposicion),
      margenSeguridad,
      recomendacion
    };
  }

  calcularPrecioProyectado7Dias(preciosHistoricos: number[], tendenciaActual: Tendencia): number {
    if (preciosHistoricos.length < 2) return Math.round(preciosHistoricos.at(-1) ?? 0);
    const n = preciosHistoricos.length;
    const indices = preciosHistoricos.map((_, i) => i);

    const sumX = indices.reduce((a, x) => a + x, 0);
    const sumY = preciosHistoricos.reduce((a, y) => a + y, 0);
    const sumXY = indices.reduce((acc, x, i) => acc + x * preciosHistoricos[i], 0);
    const sumX2 = indices.reduce((acc, x) => acc + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    const pendiente = denom ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercepto = (sumY - pendiente * sumX) / n;

    const factor = tendenciaValue(tendenciaActual);
    const ajuste = factor * 0.02;

    const precioBase = pendiente * n + intercepto;
    return Math.round(precioBase * (1 + ajuste));
  }

  calcularDistanciaMediaPrecios(precioLocal: number, precioNacional: number): DistanciaMediaPrecios {
    const diferencia = precioLocal - precioNacional;
    const diferenciaPorcentual = precioNacional ? (diferencia / precioNacional) * 100 : 0;

    let estado: DistanciaMediaPrecios['estado'] = 'Alineado';
    if (diferenciaPorcentual > 10) estado = 'Sobrevalorado';
    else if (diferenciaPorcentual < -10) estado = 'Subvalorado';

    return { precioLocal, precioNacional, diferencia, diferenciaPorcentual, estado };
  }

  /**
   * Calcula un conjunto mínimo de variables para el producto “en visualización”.
   * Sustitución requiere datasets adicionales (mismo grupo) y se calcula aparte.
   */
  calcularVariables(
    actuales: FruverData[],
    anteriores: FruverData[],
    serieMedianaNacional: number[],
    volatilidad: number,
    ipcAgroSemanal: number
  ): VariablesNegocioResultado {
    const preciosAct = actuales.map((d) => d.precio_medio).filter(Number.isFinite);
    const preciosPrev = anteriores.map((d) => d.precio_medio).filter(Number.isFinite);

    const precioNacional = median(preciosAct);
    const precioNacionalPrev = median(preciosPrev);

    const tendenciaAct = tendenciaFromNumeric(
      average(actuales.map((d) => tendenciaValue(d.tendencia)).filter(Number.isFinite))
    );
    const tendenciaPrev = tendenciaFromNumeric(
      average(anteriores.map((d) => tendenciaValue(d.tendencia)).filter(Number.isFinite))
    );
    const velocidad = this.calcularVelocidadTendencia(tendenciaAct, tendenciaPrev);

    const precioMin = Math.min(...actuales.map((d) => d.precio_minimo).filter(Number.isFinite));
    const precioMax = Math.max(...actuales.map((d) => d.precio_maximo).filter(Number.isFinite));

    const estabilidadCompra = this.calcularIndiceEstabilidadCompra(precioMax, precioMin, precioNacional);

    const costoReposicion = this.calcularCostoRealReposicion(precioMax, ipcAgroSemanal);

    const alerta = this.calcularAlertaPrecio(tendenciaAct, velocidad.velocidad, volatilidad);

    const precioProyectado7d = this.calcularPrecioProyectado7Dias(serieMedianaNacional.slice(-12), tendenciaAct);

    // Arbitraje Bogotá (si hay datos en la muestra actual)
    const preciosBogota = actuales
      .filter((d) => (d.ciudad ?? '').toLowerCase() === 'bogota')
      .map((d) => d.precio_medio)
      .filter(Number.isFinite);
    const precioBogota = median(preciosBogota);
    const margenArbitrajeBogota = preciosBogota.length
      ? this.calcularMargenArbitrajeBogota(precioBogota, precioNacional)
      : undefined;

    // Distancia (Bogotá vs nacional como default si existe)
    const distanciaMedia = preciosBogota.length
      ? this.calcularDistanciaMediaPrecios(precioBogota, precioNacional)
      : undefined;

    // Variación nacional (no se muestra como variable, pero es útil para textos/recomendaciones)
    void percentChange(precioNacional, precioNacionalPrev);

    return {
      estabilidadCompra,
      velocidadTendencia: velocidad,
      margenArbitrajeBogota,
      alerta,
      costoReposicion,
      precioProyectado7d,
      distanciaMedia
    };
  }

  calcularSustitucion(
    producto: FruverData,
    precioAnteriorProducto: number | null,
    productosMismoGrupoActual: Array<{ producto: string; precio_medio: number }>,
    productosMismoGrupoPrev: Map<string, number>,
    umbralSubida: number = 20
  ): Sustitucion | null {
    if (!precioAnteriorProducto) return null;

    const variacion = percentChange(producto.precio_medio, precioAnteriorProducto);
    if (variacion <= umbralSubida) return null;

    const alternativas = productosMismoGrupoActual
      .filter((p) => p.producto !== producto.producto)
      .map((p) => {
        const prev = productosMismoGrupoPrev.get(p.producto);
        if (!prev) return null;
        const variacionAlt = percentChange(p.precio_medio, prev);
        if (variacionAlt > 5) return null;
        const ahorroPorcentual = producto.precio_medio ? ((producto.precio_medio - p.precio_medio) / producto.precio_medio) * 100 : 0;
        return {
          productoOriginal: producto.producto,
          productoAlternativo: p.producto,
          precioOriginal: producto.precio_medio,
          precioAlternativo: p.precio_medio,
          ahorroPorcentual,
          grupoAlimentos: producto.grupo_alimentos,
          recomendacion: `La ${producto.producto} está cara (subió ${variacion.toFixed(
            1
          )}%), considera ${p.producto} (ahorro ${ahorroPorcentual.toFixed(1)}%).`
        } satisfies Sustitucion;
      })
      .filter((x): x is Sustitucion => x !== null)
      .sort((a, b) => b.ahorroPorcentual - a.ahorroPorcentual);

    return alternativas[0] ?? null;
  }
}

