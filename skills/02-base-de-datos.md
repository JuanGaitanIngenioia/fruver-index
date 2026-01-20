# Skill 2: Base de Datos

## Información General

- **Plataforma:** Supabase
- **Nombre de la Base de Datos:** `fruver_data`
- **Propósito:** Almacenar datos de precios de productos agrícolas (frutas y verduras) de diferentes mercados mayoristas en Colombia

---

## Estructura de Campos

### Tabla Principal: `fruver_data`

| Campo | Tipo de Dato | Descripción | Ejemplo |
|-------|--------------|-------------|---------|
| `idx` | Integer | Identificador único numérico del registro en la base de datos o índice de la fila | `2` |
| `producto` | String | Nombre común del alimento o producto agrícola monitoreado | `acelga` |
| `mercado_mayorista` | String | Cadena concatenada que describe la ubicación geográfica y el nombre de la central de abastos | `"bogota, d.c., corabastos"` |
| `precio_minimo` | Integer | El precio más bajo registrado para el producto durante el periodo de tiempo en la central especificada (en Pesos Colombianos - COP) | `533` |
| `precio_maximo` | Integer | El precio más alto registrado para el producto durante el periodo | `1000` |
| `precio_medio` | Integer | El promedio aritmético de los precios capturados durante el periodo | `647` |
| `tendencia` | String | Indicador cualitativo de la variación del precio respecto al periodo anterior | `++` |
| `fecha_inicio` | Date (ISO 8601) | Fecha de inicio de la semana o periodo de recolección de precios (Formato YYYY-MM-DD) | `2022-01-01` |
| `fecha_final` | Date (ISO 8601) | Fecha de finalización de la semana o periodo de recolección de precios | `2022-01-07` |
| `codigo_grupo` | Float | Código numérico de clasificación taxonómica del grupo de alimentos | `1.1` |
| `grupo_alimentos` | String | Categoría general a la que pertenece el producto | `verduras y hortalizas` |
| `ciudad` | String | Municipio o distrito donde se encuentra el mercado | `bogota` |
| `departamento` | String | Departamento (división administrativa de primer nivel en Colombia) al que pertenece la ciudad | `bogota dc` |
| `nombre_mercado` | String | Nombre específico de la plaza de mercado o central de abastos (normalizado). Si no se conoce, aparece como "desconocido" | `corabastos` |

---

## Leyenda de Tendencia

El campo `tendencia` utiliza símbolos para representar la fluctuación del precio:

| Símbolo | Significado | Descripción |
|---------|-------------|-------------|
| `+++` | Alza muy fuerte | Incremento significativo |
| `++` | Alza fuerte | Incremento considerable |
| `+` | Alza leve | Incremento moderado |
| `null` o vacío | Estable | Sin variación significativa o sin datos comparativos |
| `-` | Baja leve | Disminución moderada |
| `--` | Baja fuerte | Disminución considerable |
| `---` | Baja muy fuerte | Disminución significativa |

### Mapeo Numérico para Cálculos

Para realizar cálculos matemáticos con las tendencias, se recomienda el siguiente mapeo:

```typescript
const TENDENCIA_MAP = {
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

---

## Relaciones Geográficas

Los campos están jerarquizados geográficamente de la siguiente manera:

```
Departamento → Ciudad → Nombre_Mercado
```

### Ejemplo de Jerarquía

```
Departamento: "bogota dc"
  └── Ciudad: "bogota"
      └── Nombre_Mercado: "corabastos"
```

### Consideraciones de Implementación

- **Normalización:** Los nombres de ciudades y departamentos deben estar normalizados (minúsculas, sin acentos en algunos casos)
- **Búsqueda:** Implementar búsqueda case-insensitive para mejorar la experiencia del usuario
- **Agrupación:** Usar la jerarquía geográfica para agrupar datos y calcular promedios regionales

---

## Unidades y Formatos

### Unidades Implícitas

- **Precios:** Expresados en Pesos Colombianos (COP)
- **Cantidad:** Generalmente se refiere al precio por kilogramo o por atado/manojo dependiendo de la presentación típica del producto en la región

### Formatos de Fecha

- **Formato:** ISO 8601 (YYYY-MM-DD)
- **Ejemplo:** `2022-01-01`
- **Periodo:** Semanal (fecha_inicio a fecha_final)

---

## Clasificación de Productos

### Código de Grupo (`codigo_grupo`)

- Tipo: Float
- Propósito: Clasificación taxonómica numérica
- Ejemplo: `1.1` para "verduras y hortalizas"

### Grupo de Alimentos (`grupo_alimentos`)

- Tipo: String
- Propósito: Categoría general legible
- Ejemplos comunes:
  - `verduras y hortalizas`
  - `frutas`
  - `tubérculos`
  - `granos`

---

## Consultas Comunes

### Obtener Precios por Producto

```sql
SELECT 
  producto,
  precio_minimo,
  precio_maximo,
  precio_medio,
  tendencia,
  ciudad,
  nombre_mercado,
  fecha_inicio,
  fecha_final
FROM fruver_data
WHERE producto = 'acelga'
ORDER BY fecha_inicio DESC;
```

### Comparar Precios entre Mercados

```sql
SELECT 
  nombre_mercado,
  ciudad,
  precio_medio,
  precio_minimo,
  precio_maximo,
  tendencia
FROM fruver_data
WHERE producto = 'acelga'
  AND fecha_inicio >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY precio_medio ASC;
```

### Obtener Productos por Grupo

```sql
SELECT DISTINCT producto
FROM fruver_data
WHERE grupo_alimentos = 'verduras y hortalizas'
ORDER BY producto;
```

### Calcular Promedio Nacional

```sql
SELECT 
  producto,
  AVG(precio_medio) as precio_promedio_nacional,
  MIN(precio_minimo) as precio_minimo_nacional,
  MAX(precio_maximo) as precio_maximo_nacional
FROM fruver_data
WHERE fecha_inicio >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY producto;
```

---

## Modelo de Datos TypeScript

```typescript
interface FruverData {
  idx: number;
  producto: string;
  mercado_mayorista: string;
  precio_minimo: number;
  precio_maximo: number;
  precio_medio: number;
  tendencia: Tendencia | null;
  fecha_inicio: string; // ISO 8601 date string
  fecha_final: string; // ISO 8601 date string
  codigo_grupo: number;
  grupo_alimentos: string;
  ciudad: string;
  departamento: string;
  nombre_mercado: string;
}

type Tendencia = '+++' | '++' | '+' | '-' | '--' | '---' | null;

interface TendenciaNumeric {
  value: number; // -3 a 3
  label: string; // '+++', '++', '+', etc.
}
```

---

## Servicios Angular Recomendados

### Estructura de Servicio

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FruverData } from '../models/fruver-data.model';

@Injectable({
  providedIn: 'root'
})
export class FruverDataService {
  private apiUrl = 'https://your-supabase-url.supabase.co/rest/v1/fruver_data';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<FruverData[]> {
    // Implementar
  }

  getPreciosPorProducto(producto: string): Observable<FruverData[]> {
    // Implementar
  }

  getPreciosPorMercado(mercado: string): Observable<FruverData[]> {
    // Implementar
  }

  getPreciosPorCiudad(ciudad: string): Observable<FruverData[]> {
    // Implementar
  }

  getComparacionMercados(producto: string, fecha: string): Observable<FruverData[]> {
    // Implementar
  }
}
```

---

## Validaciones y Reglas de Negocio

### Validaciones de Datos

1. **Precios:**
   - `precio_minimo` debe ser menor o igual a `precio_maximo`
   - `precio_medio` debe estar entre `precio_minimo` y `precio_maximo`
   - Todos los precios deben ser números enteros positivos

2. **Fechas:**
   - `fecha_final` debe ser mayor o igual a `fecha_inicio`
   - Las fechas deben estar en formato ISO 8601 válido

3. **Tendencias:**
   - Solo valores válidos según la leyenda
   - Puede ser `null` o vacío si no hay datos comparativos

4. **Campos Requeridos:**
   - `producto` no puede ser vacío
   - `precio_medio` es requerido para cálculos
   - `fecha_inicio` y `fecha_final` son requeridos

---

## Índices Recomendados

Para optimizar las consultas más comunes, se recomienda crear índices en:

1. **`producto`** - Búsqueda frecuente por producto
2. **`ciudad`** - Filtrado por ubicación
3. **`fecha_inicio`** - Consultas temporales
4. **`grupo_alimentos`** - Filtrado por categoría
5. **Combinado:** `(producto, fecha_inicio)` - Consultas de tendencias

---

## Integración con Supabase

### Configuración de Cliente

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Ejemplo de Consulta con Supabase

```typescript
async getPreciosPorProducto(producto: string): Promise<FruverData[]> {
  const { data, error } = await supabase
    .from('fruver_data')
    .select('*')
    .eq('producto', producto)
    .order('fecha_inicio', { ascending: false });

  if (error) throw error;
  return data;
}
```

---

## Consideraciones de Rendimiento

1. **Paginación:** Implementar paginación para consultas grandes
2. **Caché:** Cachear consultas frecuentes (precios actuales, productos populares)
3. **Filtros:** Usar filtros en el servidor antes de traer datos
4. **Lazy Loading:** Cargar datos históricos bajo demanda
5. **Compresión:** Comprimir respuestas JSON para reducir transferencia

---

## Migraciones Futuras

### Campos Adicionales Sugeridos

Basados en las variables de negocio identificadas:

- `margen_arbitraje_bogota` (Float) - % de ganancia enviando a Bogotá vs promedio nacional
- `riesgo_regateo` (Score 1-5) - Normalización inversa del Spread
- `alerta_precio` (String) - "Compra Fuerte", "Venta Fuerte", "Estable"
- `precio_proyectado_7d` (Integer) - Precio estimado próxima semana
- `distancia_media_precios` (Integer) - Diferencia entre precio local y precio nacional

---

## Checklist de Implementación

### Fase 1: Configuración Base
- [ ] Configurar conexión a Supabase
- [ ] Crear servicio Angular para acceso a datos
- [ ] Definir interfaces TypeScript
- [ ] Configurar variables de entorno para URLs y keys

### Fase 2: Consultas Básicas
- [ ] Implementar consulta por producto
- [ ] Implementar consulta por mercado
- [ ] Implementar consulta por ciudad
- [ ] Implementar filtros por fecha

### Fase 3: Funcionalidades Avanzadas
- [ ] Implementar comparación de mercados
- [ ] Implementar cálculo de promedios nacionales
- [ ] Implementar búsqueda y filtros combinados
- [ ] Implementar paginación

### Fase 4: Optimización
- [ ] Implementar caché de consultas frecuentes
- [ ] Optimizar índices en base de datos
- [ ] Implementar lazy loading para datos históricos
- [ ] Agregar manejo de errores robusto

---

## Recursos y Referencias

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Date Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
