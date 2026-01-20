import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import type { CatalogoBasicoItem, CatalogoItem } from '../../services/fruver-data.service';
import { FruverDataService } from '../../services/fruver-data.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent {
  private readonly router = inject(Router);
  private readonly fruver = inject(FruverDataService);

  readonly quickFilters = ['Organico', 'En oferta', 'De temporada', 'Local'];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // En catálogo usamos la data liviana. Para no reescribir el template, la mapeamos a CatalogoItem “completa” con valores nulos.
  readonly items = signal<CatalogoItem[]>([]);
  readonly selectedCategories = signal<Set<string>>(new Set());

  readonly categories = computed(() => {
    const cats = Array.from(new Set(this.items().map((i) => i.grupo_alimentos))).filter(Boolean);
    return cats.sort((a, b) => a.localeCompare(b));
  });

  readonly filteredItems = computed(() => {
    const selected = this.selectedCategories();
    const items = this.items();
    if (selected.size === 0) return items;
    return items.filter((i) => selected.has(i.grupo_alimentos));
  });

  constructor() {
    void this.load();
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
      precioAnterior: null,
      cambioPct: null,
      tendenciaScore: 0
    }));
  }

  toggleCategory(category: string, checked: boolean): void {
    const next = new Set(this.selectedCategories());
    if (checked) next.add(category);
    else next.delete(category);
    this.selectedCategories.set(next);
  }

  iconFor(category: string): string {
    const c = (category ?? '').toLowerCase();
    if (c.includes('fruta')) return '🥭';
    if (c.includes('verdura') || c.includes('hortaliza')) return '🥕';
    if (c.includes('tub')) return '🥔';
    if (c.includes('grano')) return '🌾';
    return '🥗';
  }

  trendFor(item: CatalogoItem): 'up' | 'down' | 'neutral' {
    const change = item.cambioPct;
    const score = item.tendenciaScore;

    // Si el cambio es null, NaN, 0, o muy pequeño → neutral
    if (change === null || !Number.isFinite(change) || Math.abs(change) < 0.1) {
      // Verificar también el score de tendencia
      if (!Number.isFinite(score) || score === 0) {
        return 'neutral';
      }
      return score > 0 ? 'up' : 'down';
    }
    
    return change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  }

  changeLabel(item: CatalogoItem): string {
    const change = item.cambioPct;
    if (change === null || !Number.isFinite(change)) return '—';
    if (Math.abs(change) < 0.1) return 'Sin cambio';
    return `${Math.abs(change).toFixed(1)}%`;
  }

  trendText(item: CatalogoItem): string {
    const trend = this.trendFor(item);
    if (trend === 'up') return 'Subió';
    if (trend === 'down') return 'Bajó';
    return 'Estable';
  }

  trendIcon(item: CatalogoItem): string {
    const trend = this.trendFor(item);
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  }

  navigateToProducto(productName: string): void {
    const producto = (productName ?? '').toLowerCase().trim();
    if (!producto) return;
    this.router.navigate(['/producto', producto]);
  }
}
