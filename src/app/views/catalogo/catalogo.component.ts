import { CommonModule } from '@angular/common';
import { afterNextRender, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import type { CatalogoBasicoItem, CatalogoItem } from '../../services/fruver-data.service';
import { FruverDataService } from '../../services/fruver-data.service';

type PaginationItem = { kind: 'page'; value: number } | { kind: 'ellipsis' };

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent {
  private readonly fruver = inject(FruverDataService);
  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  private tl: gsap.core.Timeline | null = null;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // En catálogo usamos la data liviana. Para no reescribir el template, la mapeamos a CatalogoItem “completa” con valores nulos.
  readonly items = signal<CatalogoItem[]>([]);
  readonly selectedCategories = signal<Set<string>>(new Set());
  readonly search = signal('');
  readonly trendFilter = signal<'all' | 'up' | 'down' | 'neutral'>('all');
  readonly sort = signal<'name' | 'price' | 'trend_up' | 'trend_down'>('name');

  readonly categories = computed(() => {
    const cats = Array.from(new Set(this.items().map((i) => i.grupo_alimentos))).filter(Boolean);
    return cats.sort((a, b) => a.localeCompare(b));
  });

  readonly filteredItems = computed(() => {
    const selected = this.selectedCategories();
    const query = this.search().toLowerCase().trim();
    const trend = this.trendFilter();
    const sort = this.sort();

    let out = this.items();
    if (selected.size > 0) out = out.filter((i) => selected.has(i.grupo_alimentos));
    if (query) out = out.filter((i) => i.producto.toLowerCase().includes(query));

    if (trend !== 'all') {
      out = out.filter((i) => this.trendFor(i) === trend);
    }

    // Sorting
    const scoreFor = (i: CatalogoItem): number => {
      const c = i.cambioPct;
      return c !== null && Number.isFinite(c) ? c : Number.NaN;
    };

    out = [...out].sort((a, b) => {
      if (sort === 'name') return a.producto.localeCompare(b.producto);
      if (sort === 'price') return a.precioActual - b.precioActual;
      if (sort === 'trend_up') {
        const sa = scoreFor(a);
        const sb = scoreFor(b);
        // nulls/NaN to bottom
        if (!Number.isFinite(sa) && !Number.isFinite(sb)) return a.producto.localeCompare(b.producto);
        if (!Number.isFinite(sa)) return 1;
        if (!Number.isFinite(sb)) return -1;
        return sb - sa || a.producto.localeCompare(b.producto);
      }
      // trend_down
      const sa = scoreFor(a);
      const sb = scoreFor(b);
      if (!Number.isFinite(sa) && !Number.isFinite(sb)) return a.producto.localeCompare(b.producto);
      if (!Number.isFinite(sa)) return 1;
      if (!Number.isFinite(sb)) return -1;
      return sa - sb || a.producto.localeCompare(b.producto);
    });

    return out;
  });

  readonly page = signal(1);
  readonly pageSize = 10;

  readonly pageCount = computed(() => {
    return Math.ceil(this.filteredItems().length / this.pageSize);
  });

  readonly pagedItems = computed(() => {
    const filtered = this.filteredItems();
    const currentPage = this.page();
    const start = (currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return filtered.slice(start, end);
  });

  setPage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.pageCount()) {
      this.page.set(newPage);
      // Scroll to top of product grid
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPaginationItems(): PaginationItem[] {
    const total = this.pageCount();
    const current = this.page();
    const items: PaginationItem[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        items.push({ kind: 'page', value: i });
      }
    } else {
      // Always show first page
      items.push({ kind: 'page', value: 1 });

      if (current <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          items.push({ kind: 'page', value: i });
        }
        items.push({ kind: 'ellipsis' });
        items.push({ kind: 'page', value: total });
      } else if (current >= total - 2) {
        // Near the end
        items.push({ kind: 'ellipsis' });
        for (let i = total - 3; i <= total; i++) {
          items.push({ kind: 'page', value: i });
        }
      } else {
        // In the middle
        items.push({ kind: 'ellipsis' });
        for (let i = current - 1; i <= current + 1; i++) {
          items.push({ kind: 'page', value: i });
        }
        items.push({ kind: 'ellipsis' });
        items.push({ kind: 'page', value: total });
      }
    }

    return items;
  }

  constructor() {
    void this.load();

    afterNextRender(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const section = this.sectionRef()?.nativeElement;
      if (!section) return;

      if (prefersReduced) {
        gsap.set(section.querySelectorAll('.section-header, .filters, .product-section'), { opacity: 1, y: 0 });
        return;
      }

      this.tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      this.tl
        .from(section.querySelector('.section-header'), { opacity: 0, y: 20, duration: 0.4 })
        .from(section.querySelector('.filters'), { opacity: 0, x: -20, duration: 0.45 }, '-=0.2')
        .from(section.querySelector('.product-section'), { opacity: 0, y: 24, duration: 0.45 }, '-=0.3');
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.fruver.getCatalogoBasico();
      this.items.set(this.toCatalogoItem(data));
    } catch (e) {
      console.error('[Catalogo] Error:', e);
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el catálogo.');
    } finally {
      this.loading.set(false);
    }
  }

  private toCatalogoItem(rows: CatalogoBasicoItem[]): CatalogoItem[] {
    return rows.map((r) => ({
      producto: r.producto,
      grupo_alimentos: r.grupo_alimentos,
      codigo_grupo: r.codigo_grupo,
      precioActual: r.precioActual,
      precioAnterior: r.precioAnterior ?? null,
      cambioPct: r.cambioPct ?? null,
      tendenciaScore: r.cambioPct ?? 0 // Usamos el cambio porcentual como score
    }));
  }

  toggleCategory(category: string, checked: boolean): void {
    const next = new Set(this.selectedCategories());
    if (checked) next.add(category);
    else next.delete(category);
    this.selectedCategories.set(next);
    // Reset to page 1 when filters change
    this.page.set(1);
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  setTrendFilter(value: string): void {
    if (value === 'up' || value === 'down' || value === 'neutral' || value === 'all') {
      this.trendFilter.set(value);
      this.page.set(1);
    }
  }

  setSort(value: string): void {
    if (value === 'name' || value === 'price' || value === 'trend_up' || value === 'trend_down') {
      this.sort.set(value);
      this.page.set(1);
    }
  }

  iconFor(category: string): string {
    const c = (category ?? '').toLowerCase();
    if (c.includes('fruta')) return '🥭';
    if (c.includes('verdura') || c.includes('hortaliza')) return '🥕';
    if (c.includes('tub')) return '🥔';
    if (c.includes('grano')) return '🌾';
    return '🥗';
  }

  /**
   * Determina la tendencia basada en el cambio de precio:
   * - up: precio subió (cambioPct > 0)
   * - down: precio bajó (cambioPct < 0)
   * - neutral: sin cambio significativo (umbral muy pequeño: 0.05%)
   */
  trendFor(item: CatalogoItem): 'up' | 'down' | 'neutral' {
    const change = item.cambioPct;

    // Si el cambio es null, NaN, o prácticamente 0 → neutral
    if (change === null || !Number.isFinite(change) || Math.abs(change) < 0.05) {
      return 'neutral';
    }
    
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Muestra el porcentaje de cambio
   */
  changeLabel(item: CatalogoItem): string {
    const change = item.cambioPct;
    if (change === null || !Number.isFinite(change)) return '';
    if (Math.abs(change) < 0.05) return '';
    return `${Math.abs(change).toFixed(2)}%`;
  }

  /**
   * Texto de la tendencia: Subió o Bajó
   */
  trendText(item: CatalogoItem): string {
    const trend = this.trendFor(item);
    if (trend === 'up') return 'Subió';
    if (trend === 'down') return 'Bajó';
    return 'Estable';
  }

  /**
   * Icono de tendencia: + (verde/subió) o - (rojo/bajó) o = (neutral)
   */
  trendIcon(item: CatalogoItem): string {
    const trend = this.trendFor(item);
    if (trend === 'up') return '+';
    if (trend === 'down') return '-';
    return '=';
  }

}
