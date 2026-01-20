import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import type { CatalogoBasicoItem } from '../../services/fruver-data.service';
import { FruverDataService } from '../../services/fruver-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly fruver = inject(FruverDataService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly productos = signal<CatalogoBasicoItem[]>([]);

  readonly searchQuery = signal('');
  readonly showSuggestions = signal(false);

  readonly sugerencias = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query || query.length < 2) return [];
    
    return this.productos()
      .filter((p) => p.producto.toLowerCase().includes(query))
      .slice(0, 8);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.fruver.getCatalogoBasico();
      this.productos.set(data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.showSuggestions.set(value.trim().length >= 2);
  }

  buscar(raw: string): void {
    const producto = (raw ?? '').toLowerCase().trim();
    if (!producto) return;
    this.showSuggestions.set(false);
    this.router.navigate(['/producto', producto]);
  }

  seleccionarProducto(producto: CatalogoBasicoItem): void {
    this.showSuggestions.set(false);
    this.searchQuery.set(producto.producto);
    this.router.navigate(['/producto', producto.producto.toLowerCase()]);
  }

  ocultarSugerencias(): void {
    // Pequeño delay para permitir click en sugerencia
    setTimeout(() => this.showSuggestions.set(false), 150);
  }
}
