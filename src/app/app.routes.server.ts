import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static routes: prerendered at build time
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'acerca', renderMode: RenderMode.Prerender },
  { path: 'faq', renderMode: RenderMode.Prerender },
  { path: 'contacto', renderMode: RenderMode.Prerender },
  { path: 'catalogo', renderMode: RenderMode.Prerender },

  // Dynamic routes: SSR per request (data depends on URL param)
  { path: 'producto/:producto', renderMode: RenderMode.Server },
  { path: 'historicos/:productName', renderMode: RenderMode.Server },

  // Fallback
  { path: '**', renderMode: RenderMode.Server },
];
