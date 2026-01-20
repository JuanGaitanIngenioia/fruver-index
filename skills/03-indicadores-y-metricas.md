# Skill 3: Indicadores y Métricas

## Introducción

Este documento detalla las fórmulas matemáticas, variables y explicaciones de negocio para los indicadores clave de desempeño (KPIs) utilizados en el análisis de precios de productos agrícolas (Fruver).

Estos indicadores permiten transformar datos brutos de precios en información accionable para diferentes tipos de usuarios: productores, comerciantes, empresarios y analistas.

---

## 1. IPC-Agro (Inflación)

### Descripción

Este indicador mide la variación porcentual del precio en el tiempo, utilizando la mediana para evitar sesgos por valores extremos (outliers). Representa el cambio en el costo de vida real asociado al producto.

### Fórmula Matemática

$$I_t = \left( \frac{\tilde{P}_t}{\tilde{P}_{t-1}} - 1 \right) \times 100$$

### Variables Clave

- $\tilde{P}_t$: Mediana del precio en el periodo actual
- $\tilde{P}_{t-1}$: Mediana del precio en el periodo anterior

### Interpretación de Negocio

- **Valor Positivo:** El producto se está encareciendo estructuralmente
- **Valor Negativo:** El producto se está abaratando estructuralmente
- **Cero:** Sin cambio significativo

Permite entender si el producto se está encareciendo o abaratando estructuralmente, más allá de la volatilidad diaria.

### Implementación TypeScript

```typescript
/**
 * Calcula el IPC-Agro (Inflación) entre dos periodos
 * @param precioActual Mediana del precio en el periodo actual
 * @param precioAnterior Mediana del precio en el periodo anterior
 * @returns Porcentaje de inflación (puede ser negativo)
 */
function calcularIPCAgro(precioActual: number, precioAnterior: number): number {
  if (precioAnterior === 0) {
    throw new Error('El precio anterior no puede ser cero');
  }
  return ((precioActual / precioAnterior) - 1) * 100;
}

/**
 * Calcula la mediana de un array de precios
 */
function calcularMediana(precios: number[]): number {
  const sorted = [...precios].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}
```

### Uso Principal

- Ajuste de presupuestos de compra
- Análisis de tendencias de largo plazo
- Comparación con inflación general del país

---

## 2. Disparidad Regional (CV - Coeficiente de Variación)

### Descripción

Conocido estadísticamente como el Coeficiente de Variación. Mide la dispersión relativa de los precios entre diferentes ciudades o mercados.

### Fórmula Matemática

$$CV = \frac{\sigma_{región}}{\mu_{región}} \times 100$$

### Variables Clave

- $\sigma_{región}$: Desviación estándar de los precios en la región/país
- $\mu_{región}$: Promedio aritmético de los precios en la región/país

### Interpretación de Negocio

- **CV Alto (>30%):** "Caos de precios". Indica grandes diferencias de precio entre ciudades, sugiriendo oportunidades de arbitraje (comprar barato en un lado y vender caro en otro)
- **CV Medio (15-30%):** Variación moderada, mercado con cierta eficiencia
- **CV Bajo (<15%):** Precios homogeneizados en todo el territorio, mercado eficiente

### Implementación TypeScript

```typescript
/**
 * Calcula el Coeficiente de Variación (Disparidad Regional)
 * @param precios Array de precios de diferentes ciudades/mercados
 * @returns Coeficiente de variación como porcentaje
 */
function calcularDisparidadRegional(precios: number[]): number {
  if (precios.length === 0) {
    throw new Error('El array de precios no puede estar vacío');
  }

  const promedio = precios.reduce((sum, precio) => sum + precio, 0) / precios.length;
  
  if (promedio === 0) {
    return 0;
  }

  const varianza = precios.reduce((sum, precio) => {
    return sum + Math.pow(precio - promedio, 2);
  }, 0) / precios.length;

  const desviacionEstandar = Math.sqrt(varianza);
  
  return (desviacionEstandar / promedio) * 100;
}
```

### Uso Principal

- Logística y arbitraje geográfico
- Identificación de oportunidades de negocio
- Análisis de eficiencia del mercado

---

## 3. Fricción de Mercado (Spread)

### Descripción

Mide la brecha entre el precio máximo y mínimo registrado en una misma central o mercado en relación con su precio medio. Indica la eficiencia del regateo.

### Fórmula Matemática

$$F = \frac{P_{max} - P_{min}}{P_{med}}$$

### Variables Clave

- $P_{max}$: Precio máximo registrado en la jornada
- $P_{min}$: Precio mínimo registrado en la jornada
- $P_{med}$: Precio medio reportado

### Interpretación de Negocio

- **Spread Alto (>0.5):** Incertidumbre en la calidad o falta de información en el mercado, lo que permite un mayor rango de regateo. Mayor riesgo para el comprador.
- **Spread Medio (0.2-0.5):** Variación moderada, mercado con transparencia parcial
- **Spread Bajo (<0.2):** Mercado transparente y eficiente, precios homogéneos

### Implementación TypeScript

```typescript
/**
 * Calcula la Fricción de Mercado (Spread)
 * @param precioMaximo Precio máximo registrado
 * @param precioMinimo Precio mínimo registrado
 * @param precioMedio Precio medio reportado
 * @returns Valor del spread (0 a infinito teóricamente)
 */
function calcularFriccionMercado(
  precioMaximo: number,
  precioMinimo: number,
  precioMedio: number
): number {
  if (precioMedio === 0) {
    throw new Error('El precio medio no puede ser cero');
  }
  
  if (precioMaximo < precioMinimo) {
    throw new Error('El precio máximo debe ser mayor o igual al mínimo');
  }

  return (precioMaximo - precioMinimo) / precioMedio;
}

/**
 * Calcula el Score de Riesgo de Regateo (inverso del spread)
 * @param spread Valor del spread calculado
 * @returns Score de 1 a 5 (5 = precio fijo, 1 = mucho regateo)
 */
function calcularRiesgoRegateo(spread: number): number {
  // Normalización inversa: spread bajo = score alto
  if (spread <= 0.1) return 5;
  if (spread <= 0.2) return 4;
  if (spread <= 0.4) return 3;
  if (spread <= 0.6) return 2;
  return 1;
}
```

### Uso Principal

- Estrategia de negociación diaria
- Evaluación de transparencia del mercado
- Cálculo de riesgo para productores

---

## 4. Score de Tendencia (ST)

### Descripción

Un puntaje compuesto que cuantifica el "sentimiento" del mercado basándose en las tendencias reportadas (alzas o bajas).

### Fórmula Matemática

$$ST = \sum (w_i \cdot T_i)$$

### Variables Clave

- $w_i$: Peso ponderado asignado a la importancia del mercado o reporte
- $T_i$: Valor numérico asignado a la tendencia cualitativa (ej. +++ puede valer +3, -- puede valer -2)

### Mapeo de Tendencias

```typescript
const TENDENCIA_WEIGHTS = {
  '+++': 3,
  '++': 2,
  '+': 1,
  null: 0,
  '': 0,
  '-': -1,
  '--': -2,
  '---': -3
};
```

### Interpretación de Negocio

- **Score Positivo Alto:** Escasez (precios subiendo), presión de demanda
- **Score Cercano a Cero:** Mercado estable
- **Score Negativo:** Sobreoferta (precios bajando), presión de oferta

### Implementación TypeScript

```typescript
type Tendencia = '+++' | '++' | '+' | '-' | '--' | '---' | null | '';

interface TendenciaData {
  tendencia: Tendencia;
  peso?: number; // Peso opcional del mercado (default: 1)
}

/**
 * Calcula el Score de Tendencia
 * @param tendencias Array de objetos con tendencia y peso opcional
 * @returns Score de tendencia (puede ser negativo)
 */
function calcularScoreTendencia(tendencias: TendenciaData[]): number {
  return tendencias.reduce((score, item) => {
    const valorTendencia = TENDENCIA_WEIGHTS[item.tendencia] || 0;
    const peso = item.peso || 1;
    return score + (valorTendencia * peso);
  }, 0);
}

/**
 * Normaliza el score de tendencia a un rango de -100 a 100
 */
function normalizarScoreTendencia(score: number, totalMercados: number): number {
  if (totalMercados === 0) return 0;
  const maxScore = totalMercados * 3; // Máximo posible si todos son +++
  return (score / maxScore) * 100;
}
```

### Uso Principal

- Predicción a corto plazo (sentimiento del mercado)
- Identificación de oportunidades de compra/venta
- Análisis de presión de oferta y demanda

---

## 5. Volatilidad Histórica

### Descripción

Calcula la desviación estándar de las variaciones de precio en una ventana de tiempo histórica.

### Fórmula Matemática

$$Vol = \sqrt{\frac{\sum(x_i - \bar{x})^2}{n-1}}$$

### Variables Clave

- $x_i$: Variaciones logarítmicas o porcentuales del precio en cada periodo
- $\bar{x}$: Promedio de las variaciones
- $n$: Número de observaciones

### Interpretación de Negocio

- **Volatilidad Alta:** Producto riesgoso, precios impredecibles. Fundamental para definir cláusulas de riesgo en contratos de suministro a largo plazo.
- **Volatilidad Media:** Variación moderada, cierto nivel de previsibilidad
- **Volatilidad Baja:** Producto estable, precios predecibles

### Implementación TypeScript

```typescript
/**
 * Calcula la volatilidad histórica de precios
 * @param precios Array de precios históricos ordenados por fecha
 * @returns Volatilidad como desviación estándar
 */
function calcularVolatilidadHistorica(precios: number[]): number {
  if (precios.length < 2) {
    throw new Error('Se necesitan al menos 2 precios para calcular volatilidad');
  }

  // Calcular variaciones porcentuales
  const variaciones: number[] = [];
  for (let i = 1; i < precios.length; i++) {
    if (precios[i - 1] === 0) continue;
    const variacion = ((precios[i] - precios[i - 1]) / precios[i - 1]) * 100;
    variaciones.push(variacion);
  }

  if (variaciones.length === 0) return 0;

  // Calcular promedio de variaciones
  const promedio = variaciones.reduce((sum, v) => sum + v, 0) / variaciones.length;

  // Calcular varianza
  const varianza = variaciones.reduce((sum, v) => {
    return sum + Math.pow(v - promedio, 2);
  }, 0) / (variaciones.length - 1);

  // Desviación estándar
  return Math.sqrt(varianza);
}

/**
 * Clasifica el nivel de riesgo basado en la volatilidad
 */
function clasificarRiesgo(volatilidad: number): 'Bajo' | 'Medio' | 'Alto' {
  if (volatilidad < 10) return 'Bajo';
  if (volatilidad < 25) return 'Medio';
  return 'Alto';
}
```

### Uso Principal

- Gestión de riesgo y contratos futuros
- Análisis de estabilidad de precios
- Planificación financiera a largo plazo

---

## Resumen de Indicadores

| Indicador | ¿Qué responde? | Uso Principal |
|-----------|----------------|---------------|
| **IPC-Agro** | ¿Cuánto subió el precio real? | Ajuste de presupuestos de compra |
| **Disparidad (CV)** | ¿Están los precios locos entre ciudades? | Logística y arbitraje geográfico |
| **Fricción (Spread)** | ¿Cuánto puedo regatear? | Estrategia de negociación diaria |
| **Score Tendencia** | ¿Cómo se siente el mercado hoy? | Predicción a corto plazo (Sentimiento) |
| **Volatilidad** | ¿Qué tan riesgoso es este producto? | Gestión de riesgo y contratos futuros |

---

## Servicio Angular Recomendado

```typescript
import { Injectable } from '@angular/core';
import { FruverData } from '../models/fruver-data.model';

@Injectable({
  providedIn: 'root'
})
export class IndicadoresService {
  
  calcularIPCAgro(precioActual: number, precioAnterior: number): number {
    return calcularIPCAgro(precioActual, precioAnterior);
  }

  calcularDisparidadRegional(precios: number[]): number {
    return calcularDisparidadRegional(precios);
  }

  calcularFriccionMercado(
    precioMaximo: number,
    precioMinimo: number,
    precioMedio: number
  ): number {
    return calcularFriccionMercado(precioMaximo, precioMinimo, precioMedio);
  }

  calcularScoreTendencia(tendencias: TendenciaData[]): number {
    return calcularScoreTendencia(tendencias);
  }

  calcularVolatilidadHistorica(precios: number[]): number {
    return calcularVolatilidadHistorica(precios);
  }

  /**
   * Calcula todos los indicadores para un producto en un periodo
   */
  calcularTodosIndicadores(
    datosActuales: FruverData[],
    datosAnteriores: FruverData[]
  ): IndicadoresResultado {
    // Implementación que calcula todos los indicadores
  }
}

interface IndicadoresResultado {
  ipcAgro: number;
  disparidadRegional: number;
  friccionMercado: number;
  scoreTendencia: number;
  volatilidadHistorica: number;
}
```

---

## Visualización de Indicadores

### Componentes Angular Recomendados

1. **Card de IPC-Agro**
   - Mostrar porcentaje con color (verde si baja, naranja si sube)
   - Comparación con periodo anterior
   - Icono de tendencia

2. **Mapa de Disparidad Regional**
   - Visualización geográfica con colores según CV
   - Identificar ciudades con precios anómalos

3. **Gráfico de Fricción de Mercado**
   - Barras comparativas entre mercados
   - Indicador visual del nivel de transparencia

4. **Gauge de Score de Tendencia**
   - Indicador circular con rango -100 a 100
   - Color según sentimiento (verde positivo, rojo negativo)

5. **Gráfico de Volatilidad**
   - Línea de tiempo mostrando variaciones
   - Banda de confianza para predicciones

---

## Checklist de Implementación

### Fase 1: Funciones Base
- [ ] Implementar cálculo de IPC-Agro
- [ ] Implementar cálculo de Disparidad Regional
- [ ] Implementar cálculo de Fricción de Mercado
- [ ] Implementar cálculo de Score de Tendencia
- [ ] Implementar cálculo de Volatilidad Histórica

### Fase 2: Servicios y Utilidades
- [ ] Crear servicio Angular para indicadores
- [ ] Implementar funciones de normalización
- [ ] Crear helpers para clasificación de riesgos
- [ ] Implementar validaciones de datos

### Fase 3: Visualización
- [ ] Crear componentes de visualización para cada indicador
- [ ] Implementar gráficos y charts
- [ ] Agregar tooltips explicativos
- [ ] Implementar comparaciones temporales

### Fase 4: Optimización
- [ ] Cachear cálculos frecuentes
- [ ] Optimizar cálculos para grandes volúmenes de datos
- [ ] Implementar cálculos incrementales
- [ ] Agregar tests unitarios

---

## Recursos y Referencias

- [Coeficiente de Variación](https://es.wikipedia.org/wiki/Coeficiente_de_variación)
- [Volatilidad Financiera](https://es.wikipedia.org/wiki/Volatilidad_(finanzas))
- [Desviación Estándar](https://es.wikipedia.org/wiki/Desviación_típica)
- [Análisis de Series Temporales](https://es.wikipedia.org/wiki/Análisis_de_series_temporales)
