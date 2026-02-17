import { afterNextRender, Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-comparador',
  standalone: true,
  templateUrl: './comparador.component.html',
  styleUrl: './comparador.component.scss',
})
export class ComparadorComponent {
  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  private tl: gsap.core.Timeline | null = null;
  readonly marketPeriodTable = [
    { market: 'Mercado 1', periodA: '3.200', periodB: '3.100' },
    { market: 'Mercado 2', periodA: '3.100', periodB: '3.300' },
    { market: 'Mercado 3', periodA: '2.000', periodB: '1.500' }
  ];

  readonly periodMarketTable = [
    { period: 'A', market1: '3.200', market2: '3.100' },
    { period: 'B', market1: '3.050', market2: '3.350' },
    { period: 'C', market1: '2.980', market2: '3.020' }
  ];

  readonly nearbyMarkets = [
    {
      name: 'Plaza Minorista',
      address: 'Cra 55 #57-80, Medellin',
      price: '2.780',
      unit: 'kg',
      distance: '1.4',
      trend: 'down',
      note: 'Mejor precio hoy',
    },
    {
      name: 'Mercado La 80',
      address: 'Cl 80 #75-40, Medellin',
      price: '2.980',
      unit: 'kg',
      distance: '2.1',
      trend: 'up',
      note: 'Subió levemente',
    },
    {
      name: 'Plaza La América',
      address: 'Cl 44 #90-30, Medellin',
      price: '2.850',
      unit: 'kg',
      distance: '3.0',
      trend: 'down',
      note: 'Promedio estable',
    },
  ];

  constructor() {
    afterNextRender(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const section = this.sectionRef()?.nativeElement;
      if (!section) return;

      if (prefersReduced) {
        gsap.set(section.querySelectorAll('.section-header, .card, .market-card'), { opacity: 1, y: 0 });
        return;
      }

      this.tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      this.tl
        .from(section.querySelector('.section-header'), { opacity: 0, y: 20, duration: 0.4 })
        .from(section.querySelectorAll('.comparison-grid > .card'), {
          opacity: 0,
          y: 28,
          stagger: 0.12,
          duration: 0.45,
        }, '-=0.2')
        .from(section.querySelectorAll('.market-card'), {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.4,
        }, '-=0.2');
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
