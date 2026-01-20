export type Tendencia = '+++' | '++' | '+' | '-' | '--' | '---' | null | '';

export interface FruverData {
  idx: number;
  producto: string;
  mercado_mayorista: string;
  precio_minimo: number;
  precio_maximo: number;
  precio_medio: number;
  tendencia: Tendencia;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_final: string; // YYYY-MM-DD
  codigo_grupo: number;
  grupo_alimentos: string;
  ciudad: string;
  departamento: string;
  nombre_mercado: string;
}

const TENDENCIA_VALUES_INTERNAL: Record<'+++' | '++' | '+' | '-' | '--' | '---' | '', number> = {
  '+++': 3,
  '++': 2,
  '+': 1,
  '-': -1,
  '--': -2,
  '---': -3,
  '': 0
};

export function tendenciaValue(t: Tendencia): number {
  return TENDENCIA_VALUES_INTERNAL[t ?? ''];
}

export type RangoHistorico = '1 mes' | '6 meses' | '1 año' | 'max';

