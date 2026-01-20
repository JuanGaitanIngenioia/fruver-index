# Skills - Guía de Referencia Rápida

Este documento proporciona un resumen ejecutivo de todas las skills disponibles en el proyecto FruverIndex y cuándo usar cada una.

> 📚 Para documentación detallada, consulta los archivos en [`/skills`](./skills/)

---

## 📋 Índice de Skills

1. **[Skill 1: Diseño](./skills/01-diseño.md)** - Sistema de diseño y UI/UX
2. **[Skill 2: Base de Datos](./skills/02-base-de-datos.md)** - Estructura de datos y modelos
3. **[Skill 3: Indicadores y Métricas](./skills/03-indicadores-y-metricas.md)** - KPIs y fórmulas matemáticas
4. **[Skill 4: Variables de Negocio](./skills/04-variables-de-negocio.md)** - Lógica de negocio por tipo de usuario

---

## 🎨 Skill 1: Diseño

### ¿Qué contiene?
- Personalidad de marca y valores
- Paleta de colores (WCAG 3.0)
- Tipografía (Lexend e Inter)
- Sistema de diseño Material 3
- Prácticas de accesibilidad
- Guías de visualización

### ¿Cuándo usarla?

✅ **Úsala cuando:**
- Estás creando o modificando componentes UI
- Necesitas decidir colores, tipografías o espaciado
- Implementas nuevos elementos visuales (botones, cards, gráficos)
- Necesitas asegurar accesibilidad (WCAG 3.0)
- Diseñas para móvil o responsive
- Creas animaciones o micro-interacciones

📝 **Ejemplos de uso:**
```typescript
// Al crear un componente nuevo
import { Component } from '@angular/core';

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.scss']
})
export class ProductoCardComponent {
  // Consulta Skill 1 para:
  // - Colores: $color-primary, $color-accent
  // - Tipografía: $font-family-primary
  // - Espaciado: $spacing-md, $spacing-lg
  // - Sombras: $elevation-2
}
```

🔗 **Archivo completo:** [`skills/01-diseño.md`](./skills/01-diseño.md)

---

## 🗄️ Skill 2: Base de Datos

### ¿Qué contiene?
- Estructura completa de `fruver_data`
- Tipos de datos y campos
- Leyenda de tendencias (+++, ++, +, -, --, ---)
- Relaciones geográficas (Departamento → Ciudad → Mercado)
- Consultas SQL comunes
- Modelos TypeScript
- Servicios Angular recomendados

### ¿Cuándo usarla?

✅ **Úsala cuando:**
- Necesitas entender la estructura de datos
- Estás creando servicios para consultar la BD
- Implementas filtros o búsquedas
- Trabajas con tendencias de precios
- Necesitas mapear datos de Supabase a TypeScript
- Validas datos antes de guardarlos

📝 **Ejemplos de uso:**
```typescript
// Al crear un servicio de datos
import { Injectable } from '@angular/core';
import { FruverData } from '../models/fruver-data.model';

@Injectable({ providedIn: 'root' })
export class PreciosService {
  // Consulta Skill 2 para:
  // - Estructura de FruverData
  // - Consultas SQL optimizadas
  // - Validaciones de campos
  // - Mapeo de tendencias
}
```

🔗 **Archivo completo:** [`skills/02-base-de-datos.md`](./skills/02-base-de-datos.md)

---

## 📊 Skill 3: Indicadores y Métricas

### ¿Qué contiene?
- **IPC-Agro:** Cálculo de inflación
- **Disparidad Regional (CV):** Coeficiente de variación
- **Fricción de Mercado (Spread):** Eficiencia del regateo
- **Score de Tendencia (ST):** Sentimiento del mercado
- **Volatilidad Histórica:** Riesgo del producto
- Fórmulas matemáticas completas
- Implementaciones TypeScript

### ¿Cuándo usarla?

✅ **Úsala cuando:**
- Calculas indicadores económicos
- Implementas análisis de precios
- Creas dashboards con métricas
- Necesitas comparar mercados o regiones
- Analizas tendencias históricas
- Implementas visualizaciones de datos

📝 **Ejemplos de uso:**
```typescript
// Al calcular indicadores
import { IndicadoresService } from './services/indicadores.service';

// Consulta Skill 3 para:
// - calcularIPCAgro(precioActual, precioAnterior)
// - calcularDisparidadRegional(precios[])
// - calcularFriccionMercado(max, min, medio)
// - calcularScoreTendencia(tendencias[])
// - calcularVolatilidadHistorica(precios[])
```

🔗 **Archivo completo:** [`skills/03-indicadores-y-metricas.md`](./skills/03-indicadores-y-metricas.md)

---

## 💼 Skill 4: Variables de Negocio

### ¿Qué contiene?

**Para Productores/Campesinos:**
- Índice de Estabilidad de Compra (⭐⭐⭐⭐⭐)
- Ventana de Cosecha (Estacionalidad)

**Para Comerciantes Mayoristas:**
- Velocidad de Tendencia (Momentum)
- Margen de Arbitraje Bogotá

**Para Empresarios/Restaurantes:**
- Costo Real de Reposición
- Índice de Sustitución

**Para Analistas:**
- Alerta de Precio
- Precio Proyectado 7 Días
- Distancia Media de Precios

### ¿Cuándo usarla?

✅ **Úsala cuando:**
- Implementas funcionalidades específicas por tipo de usuario
- Calculas recomendaciones personalizadas
- Creas alertas o notificaciones
- Implementas lógica de sustitución de productos
- Proyectas precios futuros
- Analizas oportunidades de arbitraje

📝 **Ejemplos de uso:**
```typescript
// Al implementar funcionalidades por usuario
import { VariablesNegocioService } from './services/variables-negocio.service';

// Para Productores:
// - calcularIndiceEstabilidadCompra(datos)
// - calcularVentanaCosecha(datosHistoricos[])

// Para Comerciantes:
// - calcularVelocidadTendencia(actual, anterior)
// - calcularMargenArbitrajeBogota(precioBogota, promedioNacional)

// Para Empresarios:
// - calcularCostoReposicion(precioMaximo, ipcAgro)
// - calcularIndiceSustitucion(productoActual, productosMismoGrupo[])
```

🔗 **Archivo completo:** [`skills/04-variables-de-negocio.md`](./skills/04-variables-de-negocio.md)

---

## 🗺️ Mapa de Uso por Escenario

### Escenario: "Crear un nuevo componente de producto"

1. **Skill 1 (Diseño)** → Colores, tipografía, espaciado, Material 3
2. **Skill 2 (Base de Datos)** → Modelo `FruverData`, estructura de datos
3. **Skill 3 (Indicadores)** → Si muestra métricas (IPC-Agro, Spread, etc.)
4. **Skill 4 (Variables)** → Si incluye recomendaciones por tipo de usuario

### Escenario: "Implementar dashboard de análisis"

1. **Skill 2 (Base de Datos)** → Consultas SQL para obtener datos
2. **Skill 3 (Indicadores)** → Cálculo de todos los KPIs
3. **Skill 4 (Variables)** → Variables específicas por usuario
4. **Skill 1 (Diseño)** → Gráficos, visualizaciones, UI

### Escenario: "Agregar filtros de búsqueda"

1. **Skill 2 (Base de Datos)** → Campos disponibles, tipos de datos
2. **Skill 1 (Diseño)** → UI de filtros (chips, dropdowns)
3. **Skill 3 (Indicadores)** → Si filtra por indicadores calculados

### Escenario: "Implementar recomendaciones para productores"

1. **Skill 4 (Variables)** → Índice de Estabilidad, Ventana de Cosecha
2. **Skill 2 (Base de Datos)** → Datos históricos necesarios
3. **Skill 3 (Indicadores)** → Cálculo de Spread para Estabilidad
4. **Skill 1 (Diseño)** → Visualización de recomendaciones (estrellas, calendario)

---

## 🚀 Flujo de Desarrollo Recomendado

### Fase 1: Setup Inicial
1. **Skill 1** → Configurar variables SCSS, fuentes, colores
2. **Skill 2** → Crear modelos TypeScript, servicio base de datos

### Fase 2: Funcionalidades Core
1. **Skill 2** → Implementar consultas básicas (productos, precios)
2. **Skill 1** → Crear componentes UI base (cards, botones, navegación)
3. **Skill 3** → Implementar cálculo de indicadores básicos

### Fase 3: Funcionalidades Avanzadas
1. **Skill 4** → Implementar variables de negocio por usuario
2. **Skill 3** → Agregar visualizaciones de indicadores
3. **Skill 1** → Refinar UI/UX, accesibilidad

### Fase 4: Optimización
1. **Skill 2** → Optimizar consultas, índices
2. **Skill 3** → Cachear cálculos frecuentes
3. **Skill 1** → Optimizar animaciones, rendimiento

---

## 📚 Referencias Rápidas

### Colores Principales (Skill 1)
```scss
$color-primary: #2D5A27;    // Verde Bosque
$color-accent: #F28C28;     // Naranja Cítrico
$color-background: #F8F9FA;  // Gris Neutro
$color-text: #1A1A1A;       // Negro Carbón
```

### Tendencias (Skill 2)
```typescript
type Tendencia = '+++' | '++' | '+' | '-' | '--' | '---' | null;
// Mapeo: +++ = 3, ++ = 2, + = 1, - = -1, -- = -2, --- = -3
```

### Indicadores Clave (Skill 3)
- **IPC-Agro:** `((precioActual / precioAnterior) - 1) * 100`
- **Spread:** `(precioMax - precioMin) / precioMedio`
- **CV:** `(desviacionEstandar / promedio) * 100`

### Variables por Usuario (Skill 4)
- **Productor:** Estabilidad (⭐⭐⭐⭐⭐), Ventana de Cosecha
- **Comerciante:** Momentum, Arbitraje
- **Empresario:** Reposición, Sustitución
- **Analista:** Alertas, Proyecciones

---

## ✅ Checklist de Implementación

### ¿Tienes todo listo?

- [ ] **Skill 1:** Variables SCSS configuradas, fuentes importadas
- [ ] **Skill 2:** Modelos TypeScript creados, servicio de BD implementado
- [ ] **Skill 3:** Servicio de indicadores con funciones básicas
- [ ] **Skill 4:** Servicio de variables de negocio por tipo de usuario

### ¿Necesitas ayuda?

1. Consulta el archivo específico de la skill en [`/skills`](./skills/)
2. Revisa los ejemplos de código TypeScript incluidos
3. Sigue los checklists al final de cada skill
4. Verifica las referencias y recursos adicionales

---

## 🔄 Actualización de Skills

Las skills se actualizan según las necesidades del proyecto. Si encuentras:
- Información desactualizada
- Nuevos casos de uso
- Mejoras en las implementaciones

Actualiza el archivo correspondiente en [`/skills`](./skills/) y este resumen.

---

**Última actualización:** Skills creadas y documentadas para FruverIndex v1.0
