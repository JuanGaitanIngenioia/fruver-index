import { afterNextRender, Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  private tl: gsap.core.Timeline | null = null;

  readonly faqs = [
    {
      question: '¿Cada cuánto se actualizan los precios?',
      answer: 'Cada semana con el reporte del DANE.',
    },
    {
      question: '¿Cómo calculan el promedio de la canasta?',
      answer: 'Sumamos el precio de los productos de la canasta familiar y calculamos el promedio.',
    },
    {
      question: '¿Puedo registrar mi propio negocio de barrio?',
      answer: 'Actualmente no, pero lo tenemos en el roadmap.',
    },
  ];

  constructor() {
    afterNextRender(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const section = this.sectionRef()?.nativeElement;
      if (!section) return;

      if (prefersReduced) {
        gsap.set(section.querySelectorAll('.section-header, .faq-item'), { opacity: 1, y: 0 });
        return;
      }

      this.tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      this.tl
        .from(section.querySelector('.section-header'), { opacity: 0, y: 20, duration: 0.4 })
        .from(section.querySelectorAll('.faq-item'), { opacity: 0, y: 20, stagger: 0.1, duration: 0.4 }, '-=0.2');
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
