# Skill 4: Variables de Negocio

## Introducción

Este documento detalla las variables de negocio específicas diseñadas para diferentes tipos de usuarios de la plataforma FruverIndex. Cada variable está orientada a resolver problemas específicos de diferentes actores en la cadena de suministro agrícola.

---

## Variables para Productor / Campesino 🚜

**Objetivo Principal:** "¿Es buen momento para cosechar?"

### A. Índice de Estabilidad de Compra

#### ¿Qué es?

Indica qué tan confiable es el precio en una plaza específica. Ayuda al campesino a entender si el precio que ve en la app es cercano al que realmente le pagarán.

#### Lógica de Cálculo

Basado en la **Fricción de Mercado (Spread)**. Si el spread es bajo, el campesino sabe que el precio que ve en la app es muy cercano al que le pagarán real. Si es alto, sabe que le van a "castigar" el precio al llegar.

#### Fórmula

```typescript
function calcularIndiceEstabilidadCompra(spread: number): number {
  // Normalización inversa: spread bajo = índice alto (más estable)
  // Retorna un valor de 1 a 5
  if (spread <= 0.1) return 5;  // ⭐⭐⭐⭐⭐ Precio Fijo
  if (spread <= 0.2) return 4;  // ⭐⭐⭐⭐ Estable
  if (spread <= 0.4) return 3;  // ⭐⭐⭐ Moderado
  if (spread <= 0.6) return 2;  // ⭐⭐ Variable
  return 1;                      // ⭐ Mucho regateo/Riesgo
}
```

#### Variable Visual

- ⭐⭐⭐⭐⭐ (Precio Fijo) - Spread ≤ 0.1
- ⭐⭐⭐⭐ (Estable) - Spread 0.1-0.2
- ⭐⭐⭐ (Moderado) - Spread 0.2-0.4
- ⭐⭐ (Variable) - Spread 0.4-0.6
- ⭐ (Mucho regateo/Riesgo) - Spread > 0.6

#### Implementación TypeScript

```typescript
interface IndiceEstabilidadCompra {
  valor: number;        // 1 a 5
  estrellas: string;   // "⭐⭐⭐⭐⭐"
  descripcion: string;  // "Precio Fijo", "Estable", etc.
  riesgo: 'Bajo' | 'Medio' | 'Alto';
}

function calcularIndiceEstabilidadCompra(
  precioMaximo: number,
  precioMinimo: number,
  precioMedio: number
): IndiceEstabilidadCompra {
  const spread = (precioMaximo - precioMinimo) / precioMedio;
  
  let valor: number;
  let estrellas: string;
  let descripcion: string;
  let riesgo: 'Bajo' | 'Medio' | 'Alto';

  if (spread <= 0.1) {
    valor = 5;
    estrellas = '⭐⭐⭐⭐⭐';
    descripcion = 'Precio Fijo';
    riesgo = 'Bajo';
  } else if (spread <= 0.2) {
    valor = 4;
    estrellas = '⭐⭐⭐⭐';
    descripcion = 'Estable';
    riesgo = 'Bajo';
  } else if (spread <= 0.4) {
    valor = 3;
    estrellas = '⭐⭐⭐';
    descripcion = 'Moderado';
    riesgo = 'Medio';
  } else if (spread <= 0.6) {
    valor = 2;
    estrellas = '⭐⭐';
    descripcion = 'Variable';
    riesgo = 'Medio';
  } else {
    valor = 1;
    estrellas = '⭐';
    descripcion = 'Mucho regateo/Riesgo';
    riesgo = 'Alto';
  }

  return { valor, estrellas, descripcion, riesgo };
}
```

---

### B. Ventana de Cosecha (Estacionalidad)

#### ¿Qué es?

Identificación de las semanas del año donde históricamente el precio sube por escasez. Permite planificar la siembra para salir al mercado justo cuando la oferta es baja y los precios son altos.

#### Lógica de Cálculo

Análisis histórico de fechas vs `precio_medio`. Se identifican patrones estacionales donde los precios tienden a ser más altos.

#### Implementación TypeScript

```typescript
interface VentanaCosecha {
  semanaInicio: number;      // Semana del año (1-52)
  semanaFin: number;
  precioPromedioHistorico: number;
  precioPromedioGeneral: number;
  diferenciaPorcentual: number;
  recomendacion: 'Óptima' | 'Buena' | 'Regular' | 'Evitar';
}

function calcularVentanaCosecha(
  datosHistoricos: FruverData[]
): VentanaCosecha[] {
  // Agrupar por semana del año
  const datosPorSemana = new Map<number, number[]>();
  
  datosHistoricos.forEach(dato => {
    const semana = obtenerSemanaDelAnio(dato.fecha_inicio);
    if (!datosPorSemana.has(semana)) {
      datosPorSemana.set(semana, []);
    }
    datosPorSemana.get(semana)!.push(dato.precio_medio);
  });

  // Calcular precio promedio por semana
  const precioPromedioGeneral = calcularPromedio(
    datosHistoricos.map(d => d.precio_medio)
  );

  const ventanas: VentanaCosecha[] = [];

  datosPorSemana.forEach((precios, semana) => {
    const precioPromedioSemana = calcularPromedio(precios);
    const diferenciaPorcentual = 
      ((precioPromedioSemana - precioPromedioGeneral) / precioPromedioGeneral) * 100;

    let recomendacion: 'Óptima' | 'Buena' | 'Regular' | 'Evitar';
    if (diferenciaPorcentual > 20) recomendacion = 'Óptima';
    else if (diferenciaPorcentual > 10) recomendacion = 'Buena';
    else if (diferenciaPorcentual > 0) recomendacion = 'Regular';
    else recomendacion = 'Evitar';

    ventanas.push({
      semanaInicio: semana,
      semanaFin: semana,
      precioPromedioHistorico: precioPromedioSemana,
      precioPromedioGeneral,
      diferenciaPorcentual,
      recomendacion
    });
  });

  // Ordenar por diferencia porcentual descendente
  return ventanas.sort((a, b) => b.diferenciaPorcentual - a.diferenciaPorcentual);
}

function obtenerSemanaDelAnio(fecha: string): number {
  const date = new Date(fecha);
  const inicioAno = new Date(date.getFullYear(), 0, 1);
  const dias = Math.floor((date.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((dias + inicioAno.getDay() + 1) / 7);
}
```

#### Valor de Negocio

Permite planificar la siembra para salir al mercado justo cuando la oferta es baja y los precios son altos, maximizando los ingresos del productor.

---

## Variables para Comerciante Mayorista / Intermediario 🚚

**Objetivo Principal:** Arbitraje (Comprar barato aquí, vender caro allá)

### C. Velocidad de Tendencia (Momentum)

#### ¿Qué es?

Mide qué tan rápido está cambiando el precio. No solo si sube, sino la aceleración. Ayuda a decidir si acumular inventario (si se prevé alza fuerte) o liquidar rápido (si se prevé desplome).

#### Lógica de Cálculo

Derivada del campo `tendencia`. Si pasa de `null` a `++` en una semana, hay un shock de oferta. Se calcula la velocidad de cambio comparando tendencias entre periodos consecutivos.

#### Implementación TypeScript

```typescript
interface VelocidadTendencia {
  velocidad: number;           // -3 a 3 (aceleración)
  tendenciaActual: Tendencia;
  tendenciaAnterior: Tendencia;
  cambio: 'Aceleración Fuerte' | 'Aceleración Moderada' | 'Estable' | 'Desaceleración Moderada' | 'Desaceleración Fuerte';
  recomendacion: 'Acumular' | 'Mantener' | 'Liquidar';
}

const TENDENCIA_VALUES = {
  '+++': 3,
  '++': 2,
  '+': 1,
  null: 0,
  '': 0,
  '-': -1,
  '--': -2,
  '---': -3
};

function calcularVelocidadTendencia(
  tendenciaActual: Tendencia,
  tendenciaAnterior: Tendencia
): VelocidadTendencia {
  const valorActual = TENDENCIA_VALUES[tendenciaActual] || 0;
  const valorAnterior = TENDENCIA_VALUES[tendenciaAnterior] || 0;
  
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

  return {
    velocidad,
    tendenciaActual,
    tendenciaAnterior,
    cambio,
    recomendacion
  };
}
```

#### Valor de Negocio

Ayuda a decidir si acumular inventario (si se prevé alza fuerte) o liquidar rápido (si se prevé desplome), optimizando el arbitraje geográfico.

---

### D. Margen de Arbitraje Bogotá

#### ¿Qué es?

Porcentaje de ganancia potencial enviando productos a Bogotá vs el promedio nacional.

#### Lógica de Cálculo

Compara el precio en Bogotá con el precio promedio nacional. Si Bogotá tiene precio más alto, calcula el margen de ganancia después de considerar costos de transporte.

#### Implementación TypeScript

```typescript
interface MargenArbitraje {
  margenBruto: number;         // Porcentaje antes de costos
  margenNeto: number;          // Porcentaje después de costos estimados
  precioBogota: number;
  precioPromedioNacional: number;
  costoTransporteEstimado: number;  // Porcentaje del precio
  recomendacion: 'Alto' | 'Medio' | 'Bajo' | 'No Recomendado';
}

function calcularMargenArbitrajeBogota(
  precioBogota: number,
  precioPromedioNacional: number,
  costoTransportePorcentual: number = 15  // 15% por defecto
): MargenArbitraje {
  if (precioBogota <= precioPromedioNacional) {
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

  let recomendacion: 'Alto' | 'Medio' | 'Bajo' | 'No Recomendado';
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
```

---

## Variables para Empresario / Restaurante / Retail 🏪

**Objetivo Principal:** Estabilidad de costos y Presupuesto

### E. Costo Real de Reposición

#### ¿Qué es?

El precio máximo probable que tendrán que pagar para asegurar calidad "extra". Los restaurantes no pueden cambiar el menú a diario. Esta variable les permite fijar precios de sus platos cubriendo el riesgo de subida de insumos.

#### Lógica de Cálculo

Se utiliza el `precio_maximo` y se le suma la inflación semanal (IPC-Agro) proyectada.

#### Implementación TypeScript

```typescript
interface CostoReposicion {
  precioActual: number;
  precioMaximo: number;
  ipcAgroSemanal: number;      // Inflación semanal proyectada
  precioReposicion: number;    // Precio máximo + inflación
  margenSeguridad: number;     // Porcentaje de margen adicional
  recomendacion: string;
}

function calcularCostoRealReposicion(
  precioMaximo: number,
  ipcAgroSemanal: number,
  margenSeguridad: number = 10  // 10% por defecto
): CostoReposicion {
  // Calcular inflación proyectada para próximas semanas
  const inflacionProyectada = ipcAgroSemanal * 4; // Proyectar 4 semanas
  
  // Precio de reposición = precio máximo + inflación + margen de seguridad
  const precioReposicion = precioMaximo * (1 + inflacionProyectada / 100) * (1 + margenSeguridad / 100);

  let recomendacion: string;
  if (inflacionProyectada > 20) {
    recomendacion = 'Alta volatilidad. Considerar ajustar precios del menú.';
  } else if (inflacionProyectada > 10) {
    recomendacion = 'Moderada volatilidad. Monitorear semanalmente.';
  } else {
    recomendacion = 'Estable. Puede mantener precios actuales.';
  }

  return {
    precioActual: precioMaximo,
    precioMaximo,
    ipcAgroSemanal,
    precioReposicion: Math.round(precioReposicion),
    margenSeguridad,
    recomendacion
  };
}
```

---

### F. Índice de Sustitución

#### ¿Qué es?

Sugerencia automática de productos alternativos cuando el precio actual se dispara. Si la acelga sube >20% y la espinaca (mismo grupo alimenticio 1.1) baja o se mantiene, el sistema sugiere: "La acelga está cara, compre espinaca".

#### Lógica de Cálculo

Compara productos del mismo `codigo_grupo` o `grupo_alimentos`. Si un producto sube más del 20% y otro baja o se mantiene, se sugiere la sustitución.

#### Implementación TypeScript

```typescript
interface Sustitucion {
  productoOriginal: string;
  productoAlternativo: string;
  precioOriginal: number;
  precioAlternativo: number;
  ahorroPorcentual: number;
  grupoAlimentos: string;
  recomendacion: string;
}

function calcularIndiceSustitucion(
  productoActual: FruverData,
  productosMismoGrupo: FruverData[],
  umbralSubida: number = 20  // 20% por defecto
): Sustitucion | null {
  const precioActual = productoActual.precio_medio;
  const precioAnterior = obtenerPrecioAnterior(productoActual); // Necesita implementación
  
  if (!precioAnterior) return null;

  const variacionPorcentual = ((precioActual - precioAnterior) / precioAnterior) * 100;

  // Si no subió más del umbral, no hay necesidad de sustitución
  if (variacionPorcentual <= umbralSubida) return null;

  // Buscar alternativas en el mismo grupo que hayan bajado o se mantengan
  const alternativas = productosMismoGrupo
    .filter(p => p.producto !== productoActual.producto)
    .map(p => {
      const precioAltAnterior = obtenerPrecioAnterior(p);
      if (!precioAltAnterior) return null;
      
      const variacionAlt = ((p.precio_medio - precioAltAnterior) / precioAltAnterior) * 100;
      
      // Si la alternativa bajó o se mantuvo estable
      if (variacionAlt <= 5) {
        const ahorroPorcentual = ((precioActual - p.precio_medio) / precioActual) * 100;
        return {
          productoOriginal: productoActual.producto,
          productoAlternativo: p.producto,
          precioOriginal: precioActual,
          precioAlternativo: p.precio_medio,
          ahorroPorcentual,
          grupoAlimentos: productoActual.grupo_alimentos,
          recomendacion: `La ${productoActual.producto} está cara (subió ${variacionPorcentual.toFixed(1)}%), considere ${p.producto} (ahorro del ${ahorroPorcentual.toFixed(1)}%)`
        };
      }
      return null;
    })
    .filter((s): s is Sustitucion => s !== null)
    .sort((a, b) => b.ahorroPorcentual - a.ahorroPorcentual);

  return alternativas.length > 0 ? alternativas[0] : null;
}
```

#### Valor de Negocio

Optimización de costos de materia prima sin sacrificar calidad nutricional, ya que se mantiene dentro del mismo grupo alimenticio.

---

## Variables Adicionales para Analistas

### G. Alerta de Precio

#### ¿Qué es?

Clasificación automática del estado del mercado: "Compra Fuerte", "Venta Fuerte", "Estable".

#### Implementación TypeScript

```typescript
type AlertaPrecio = 'Compra Fuerte' | 'Venta Fuerte' | 'Estable' | 'Monitorear';

function calcularAlertaPrecio(
  tendencia: Tendencia,
  velocidadTendencia: number,
  volatilidad: number
): AlertaPrecio {
  const valorTendencia = TENDENCIA_VALUES[tendencia] || 0;

  // Compra Fuerte: Tendencia muy negativa (precios bajando)
  if (valorTendencia <= -2 && velocidadTendencia <= -1) {
    return 'Compra Fuerte';
  }

  // Venta Fuerte: Tendencia muy positiva (precios subiendo)
  if (valorTendencia >= 2 && velocidadTendencia >= 1) {
    return 'Venta Fuerte';
  }

  // Estable: Tendencia neutra y baja volatilidad
  if (valorTendencia === 0 && volatilidad < 10) {
    return 'Estable';
  }

  return 'Monitorear';
}
```

---

### H. Precio Proyectado 7 Días

#### ¿Qué es?

Precio estimado para la próxima semana usando regresión simple basada en tendencias históricas.

#### Implementación TypeScript

```typescript
function calcularPrecioProyectado7Dias(
  preciosHistoricos: number[],
  tendenciaActual: Tendencia
): number {
  if (preciosHistoricos.length < 2) {
    throw new Error('Se necesitan al menos 2 precios históricos');
  }

  // Regresión lineal simple
  const n = preciosHistoricos.length;
  const indices = preciosHistoricos.map((_, i) => i);
  
  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = preciosHistoricos.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * preciosHistoricos[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercepto = (sumY - pendiente * sumX) / n;

  // Ajustar según tendencia actual
  const factorTendencia = TENDENCIA_VALUES[tendenciaActual] || 0;
  const ajusteTendencia = factorTendencia * 0.02; // 2% por punto de tendencia

  // Proyectar para el próximo periodo (n+1)
  const precioBase = pendiente * n + intercepto;
  const precioProyectado = precioBase * (1 + ajusteTendencia);

  return Math.round(precioProyectado);
}
```

---

### I. Distancia Media de Precios

#### ¿Qué es?

Diferencia entre precio local y precio nacional promedio. Ayuda a identificar si un mercado está sobrevalorado o subvalorado.

#### Implementación TypeScript

```typescript
interface DistanciaMediaPrecios {
  precioLocal: number;
  precioNacional: number;
  diferencia: number;
  diferenciaPorcentual: number;
  estado: 'Sobrevalorado' | 'Subvalorado' | 'Alineado';
}

function calcularDistanciaMediaPrecios(
  precioLocal: number,
  precioNacional: number
): DistanciaMediaPrecios {
  const diferencia = precioLocal - precioNacional;
  const diferenciaPorcentual = (diferencia / precioNacional) * 100;

  let estado: 'Sobrevalorado' | 'Subvalorado' | 'Alineado';
  if (diferenciaPorcentual > 10) estado = 'Sobrevalorado';
  else if (diferenciaPorcentual < -10) estado = 'Subvalorado';
  else estado = 'Alineado';

  return {
    precioLocal,
    precioNacional,
    diferencia,
    diferenciaPorcentual,
    estado
  };
}
```

---

## Resumen de Variables por Usuario

| Variable | Usuario Objetivo | Propósito |
|----------|------------------|-----------|
| **Índice de Estabilidad de Compra** | Productor/Campesino | Evaluar confiabilidad del precio |
| **Ventana de Cosecha** | Productor/Campesino | Planificar siembra para máximo precio |
| **Velocidad de Tendencia** | Comerciante Mayorista | Decidir acumular o liquidar inventario |
| **Margen de Arbitraje** | Comerciante Mayorista | Identificar oportunidades de arbitraje |
| **Costo Real de Reposición** | Empresario/Restaurante | Fijar precios de menú con margen de seguridad |
| **Índice de Sustitución** | Empresario/Restaurante | Optimizar costos con productos alternativos |
| **Alerta de Precio** | Todos | Clasificación rápida del estado del mercado |
| **Precio Proyectado 7D** | Analista | Predicción a corto plazo |
| **Distancia Media Precios** | Analista | Identificar desalineaciones de mercado |

---

## Servicio Angular Recomendado

```typescript
import { Injectable } from '@angular/core';
import { FruverData } from '../models/fruver-data.model';

@Injectable({
  providedIn: 'root'
})
export class VariablesNegocioService {
  
  // Variables para Productor
  calcularIndiceEstabilidadCompra(datos: FruverData): IndiceEstabilidadCompra {
    return calcularIndiceEstabilidadCompra(
      datos.precio_maximo,
      datos.precio_minimo,
      datos.precio_medio
    );
  }

  calcularVentanaCosecha(datosHistoricos: FruverData[]): VentanaCosecha[] {
    return calcularVentanaCosecha(datosHistoricos);
  }

  // Variables para Comerciante
  calcularVelocidadTendencia(
    tendenciaActual: Tendencia,
    tendenciaAnterior: Tendencia
  ): VelocidadTendencia {
    return calcularVelocidadTendencia(tendenciaActual, tendenciaAnterior);
  }

  calcularMargenArbitrajeBogota(
    precioBogota: number,
    precioPromedioNacional: number
  ): MargenArbitraje {
    return calcularMargenArbitrajeBogota(precioBogota, precioPromedioNacional);
  }

  // Variables para Empresario
  calcularCostoReposicion(
    precioMaximo: number,
    ipcAgroSemanal: number
  ): CostoReposicion {
    return calcularCostoRealReposicion(precioMaximo, ipcAgroSemanal);
  }

  calcularIndiceSustitucion(
    productoActual: FruverData,
    productosMismoGrupo: FruverData[]
  ): Sustitucion | null {
    return calcularIndiceSustitucion(productoActual, productosMismoGrupo);
  }

  // Variables para Analistas
  calcularAlertaPrecio(
    tendencia: Tendencia,
    velocidadTendencia: number,
    volatilidad: number
  ): AlertaPrecio {
    return calcularAlertaPrecio(tendencia, velocidadTendencia, volatilidad);
  }

  calcularPrecioProyectado(preciosHistoricos: number[], tendencia: Tendencia): number {
    return calcularPrecioProyectado7Dias(preciosHistoricos, tendencia);
  }

  calcularDistanciaMediaPrecios(
    precioLocal: number,
    precioNacional: number
  ): DistanciaMediaPrecios {
    return calcularDistanciaMediaPrecios(precioLocal, precioNacional);
  }
}
```

---

## Checklist de Implementación

### Fase 1: Variables Base
- [ ] Implementar Índice de Estabilidad de Compra
- [ ] Implementar Ventana de Cosecha
- [ ] Implementar Velocidad de Tendencia
- [ ] Implementar Margen de Arbitraje

### Fase 2: Variables Avanzadas
- [ ] Implementar Costo Real de Reposición
- [ ] Implementar Índice de Sustitución
- [ ] Implementar Alerta de Precio
- [ ] Implementar Precio Proyectado 7D

### Fase 3: Servicios y UI
- [ ] Crear servicio Angular para variables de negocio
- [ ] Crear componentes de visualización por tipo de usuario
- [ ] Implementar dashboards personalizados
- [ ] Agregar recomendaciones contextuales

### Fase 4: Optimización
- [ ] Cachear cálculos frecuentes
- [ ] Implementar notificaciones push para alertas
- [ ] Agregar historial de recomendaciones
- [ ] Implementar tests unitarios

---

## Recursos y Referencias

- [Análisis de Arbitraje](https://es.wikipedia.org/wiki/Arbitraje)
- [Planificación de Cosechas](https://es.wikipedia.org/wiki/Agricultura)
- [Gestión de Inventarios](https://es.wikipedia.org/wiki/Gestión_de_inventarios)
- [Análisis de Sustitución de Productos](https://es.wikipedia.org/wiki/Elasticidad_cruzada_de_la_demanda)
