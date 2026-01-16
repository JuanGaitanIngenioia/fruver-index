# Skill 1: Diseño

## Personalidad de Marca: "El Asesor Inteligente y Natural"

La plataforma no debe sentirse como una hoja de cálculo fría, sino como un vecino experto que te ayuda a ahorrar.

- **Valores:** Transparencia, Frescura, Eficiencia y Empatía.
- **Tono de Voz:** Directo, informativo y alentador.

---

## Paleta de Colores (Enfoque WCAG 3.0)

Bajo **WCAG 3.0 (APCA - Accessible Perceptual Contrast Algorithm)**, nos enfocamos en el contraste de luminancia percibida más que en ratios fijos.

### Colores Principales

- **Verde Bosque (Primario):** `#2D5A27`
  - Representa frescura y estabilidad
  - Se usa en botones principales y navegación
  - Uso: CTAs principales, elementos de navegación activos, indicadores de éxito

- **Naranja Cítrico (Acento):** `#F28C28`
  - Evoca vitalidad y ahorro
  - Ideal para alertas de "Baja de precio" o botones de acción secundaria
  - Uso: Alertas de descuento, botones secundarios, elementos destacados

- **Gris Neutro (Fondo):** `#F8F9FA`
  - Para mantener una interfaz limpia y reducir la fatiga visual
  - Uso: Fondos de página, contenedores, áreas de descanso visual

- **Negro Carbón (Texto):** `#1A1A1A`
  - Asegura una legibilidad óptima sobre fondos claros
  - Uso: Texto principal, títulos, contenido importante

### Variables CSS Recomendadas

```scss
// Colores principales
$color-primary: #2D5A27;      // Verde Bosque
$color-accent: #F28C28;       // Naranja Cítrico
$color-background: #F8F9FA;    // Gris Neutro
$color-text: #1A1A1A;         // Negro Carbón

// Colores semánticos (para estados y feedback)
$color-success: #2D5A27;      // Verde (precio bajo)
$color-warning: #F28C28;      // Naranja (alerta)
$color-error: #DC3545;        // Rojo (solo con iconos, no solo color)
$color-info: #0D6EFD;         // Azul (información)
```

> **Nota de Accesibilidad:** Evita usar el rojo y el verde como únicos indicadores de cambio de precio. Acompáñalos siempre con iconos (flechas arriba/abajo) para usuarios con daltonismo.

---

## Tipografía: Legibilidad ante todo

Buscaremos una combinación que funcione perfectamente en dispositivos móviles, donde el usuario consultará los precios mientras merca.

### Fuentes

- **Primaria (Títulos):** **Lexend**
  - Fuente diseñada específicamente para mejorar la fluidez de lectura
  - Reduce la fatiga visual
  - Ideal para títulos y encabezados

- **Secundaria (Cuerpo):** **Inter**
  - Sans-serif moderna, altamente legible en pantallas pequeñas
  - Excelente renderización de números (crucial para los precios)
  - Ideal para texto de cuerpo y datos

### Escala Tipográfica

```scss
// Títulos
$font-size-h1: 32px;      // Bold
$font-size-h2: 24px;      // Semi-bold
$font-size-h3: 20px;      // Semi-bold
$font-size-h4: 18px;      // Medium

// Cuerpo
$font-size-body: 16px;    // Regular
$font-size-small: 14px;   // Regular
$font-size-caption: 12px; // Regular

// Datos numéricos
$font-size-price: 18px;   // Bold, con tabular lining
```

**Nota sobre Precios:** Usar fuentes monoespaciadas o con *tabular lining* para que los precios en las tablas se alineen perfectamente.

### Implementación en Angular

```scss
// Importar fuentes (Google Fonts)
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

// Variables de tipografía
$font-family-primary: 'Lexend', sans-serif;
$font-family-secondary: 'Inter', sans-serif;
$font-family-mono: 'Inter', monospace; // Para precios
```

---

## Sistema de Diseño: Material 3 (Material You)

Dado que usas **Angular**, la implementación de **Material 3 (M3)** es el camino natural.

### Componentes Principales

#### Cards con Elevación Baja
- Contenedores con bordes redondeados (`16px`)
- Sombras sutiles para los productos
- Ayuda a separar visualmente la información sin saturar
- Padding interno: `16px` o `24px` según el contenido

#### Chips de Filtro
- Implementar chips para las categorías (Frutas, Verduras, Plazas, Supermercados)
- Fáciles de tocar en móviles (cumpliendo con el área de toque de min. 44x44dp)
- Estados: default, hover, active, disabled
- Altura mínima: `32px` en desktop, `40px` en móvil

#### Navegación
- **Bottom Navigation Bar** en móviles para acceso rápido
- Secciones: "Inicio", "Catálogo" y "Comparador"
- Altura: `56px` (Material Design spec)
- Iconos con etiquetas de texto

#### Botones
- **Primario:** Fondo verde bosque (`#2D5A27`), texto blanco
- **Secundario:** Borde verde bosque, fondo transparente
- **Acento:** Fondo naranja cítrico (`#F28C28`), texto blanco
- Altura mínima: `40px` en desktop, `44px` en móvil
- Border radius: `8px`

### Espaciado

```scss
// Sistema de espaciado (basado en múltiplos de 4px)
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;
```

### Sombras (Elevación)

```scss
// Material 3 elevation levels
$elevation-0: none;
$elevation-1: 0px 1px 2px rgba(0, 0, 0, 0.1);
$elevation-2: 0px 2px 4px rgba(0, 0, 0, 0.1);
$elevation-3: 0px 4px 8px rgba(0, 0, 0, 0.12);
$elevation-4: 0px 8px 16px rgba(0, 0, 0, 0.12);
```

---

## Aplicación de Prácticas WCAG 3.0

Para que tu plataforma sea verdaderamente inclusiva:

### 1. Contraste de Texto
- Texto importante debe tener un valor de contraste APCA de al menos:
  - **Lc 60** para cuerpo de texto
  - **Lc 75** para texto pequeño
- Verificar contraste entre texto y fondo en todos los estados (hover, active, disabled)

### 2. Estados de Enfoque (Focus States)
- Para usuarios que navegan con teclado, los bordes de enfoque deben ser claramente visibles
- Anillo de color `#F28C28` de `2px` es ideal
- Outline offset: `2px` para separar del elemento

```scss
// Ejemplo de focus state
&:focus-visible {
  outline: 2px solid $color-accent;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 3. Jerarquía Visual
- El precio debe ser el elemento con mayor peso visual en la vista de comparación
- Usar tamaño de fuente, peso y color para establecer jerarquía
- Espaciado adecuado entre elementos relacionados

### 4. Etiquetado Semántico
- Cada campo de búsqueda y filtro debe tener etiquetas `<label>` claras
- Usar `aria-label` o `aria-labelledby` cuando sea necesario
- Implementar `aria-live` para actualizaciones dinámicas de precios

### 5. Áreas de Toque
- Mínimo `44x44px` en dispositivos móviles (Material Design)
- Espaciado adecuado entre elementos interactivos

### 6. Indicadores de Estado
- No depender solo del color para indicar cambios
- Usar iconos, texto y color combinados
- Ejemplo: Precio subió → Icono ↑ + Color + Texto "Subió"

---

## Gráficos de Interés

Para la visualización de datos:

### Gráficos de Áreas Suavizadas
- Para la canasta familiar (transmite fluidez)
- Mostrar tendencias de precios a lo largo del tiempo
- Usar gradientes sutiles con los colores de la marca

### Barras Comparativas
- Para comparar los 3 mercados cercanos
- Permitir ver la brecha de ahorro de forma instantánea
- Usar colores distintivos pero accesibles
- Incluir valores numéricos en las barras

### Micro-interacciones
- **Skeleton screens:** Mientras los precios se cargan desde el backend en Node.js
- Mejora la percepción de velocidad
- Animaciones sutiles en transiciones (duración: 200-300ms)
- Feedback visual en acciones del usuario (hover, click)

### Animaciones Recomendadas

```scss
// Transiciones estándar
$transition-fast: 150ms ease-in-out;
$transition-base: 250ms ease-in-out;
$transition-slow: 350ms ease-in-out;

// Easing functions
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);
```

---

## Responsive Design

### Breakpoints

```scss
// Mobile first approach
$breakpoint-xs: 0px;      // Móvil pequeño
$breakpoint-sm: 576px;    // Móvil grande
$breakpoint-md: 768px;    // Tablet
$breakpoint-lg: 992px;    // Desktop pequeño
$breakpoint-xl: 1200px;   // Desktop grande
$breakpoint-xxl: 1400px;  // Desktop extra grande
```

### Estrategia Mobile-First
- Diseñar primero para móviles
- Navegación inferior en móviles
- Navegación lateral o superior en desktop
- Tablas responsivas con scroll horizontal en móvil si es necesario

---

## Checklist de Implementación

### Fase 1: Configuración Base
- [ ] Importar fuentes (Lexend e Inter) desde Google Fonts
- [ ] Configurar variables SCSS para colores
- [ ] Configurar variables SCSS para tipografía
- [ ] Configurar variables SCSS para espaciado
- [ ] Configurar variables SCSS para sombras/elevación

### Fase 2: Componentes Base
- [ ] Implementar sistema de botones (primario, secundario, acento)
- [ ] Implementar cards con elevación
- [ ] Implementar chips de filtro
- [ ] Implementar bottom navigation (móvil)
- [ ] Implementar estados de focus accesibles

### Fase 3: Componentes Específicos
- [ ] Componente de comparación de precios
- [ ] Componente de gráfico de áreas (canasta familiar)
- [ ] Componente de barras comparativas
- [ ] Skeleton screens para carga de datos
- [ ] Indicadores de cambio de precio (con iconos)

### Fase 4: Accesibilidad
- [ ] Verificar contraste APCA en todos los textos
- [ ] Implementar etiquetas semánticas en formularios
- [ ] Agregar aria-labels donde sea necesario
- [ ] Probar navegación con teclado
- [ ] Probar con lectores de pantalla

### Fase 5: Optimización
- [ ] Optimizar animaciones (usar transform y opacity)
- [ ] Implementar lazy loading para imágenes
- [ ] Optimizar rendimiento de gráficos
- [ ] Testing en diferentes dispositivos

---

## Recursos y Referencias

- [Material Design 3](https://m3.material.io/)
- [WCAG 3.0 Guidelines](https://www.w3.org/WAI/WCAG3/)
- [APCA Contrast Calculator](https://www.myndex.com/APCA/)
- [Lexend Font](https://fonts.google.com/specimen/Lexend)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Angular Material](https://material.angular.io/)

---

## Notas Adicionales

- Mantener consistencia en el uso de colores y tipografía
- Documentar cualquier desviación del sistema de diseño
- Revisar periódicamente la accesibilidad conforme evoluciona la aplicación
- Considerar modo oscuro en futuras iteraciones (mantener contraste APCA)
