import { afterNextRender, Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-contacto',
  standalone: true,
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.scss',
})
export class ContactoComponent {
  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  private tl: gsap.core.Timeline | null = null;

  constructor() {
    afterNextRender(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const section = this.sectionRef()?.nativeElement;
      if (!section) return;

      if (prefersReduced) {
        gsap.set(section.querySelectorAll('.section-header, .card'), { opacity: 1, y: 0 });
        return;
      }

      this.tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      this.tl
        .from(section.querySelector('.section-header'), { opacity: 0, y: 20, duration: 0.4 })
        .from(section.querySelectorAll('.card'), { opacity: 0, y: 28, stagger: 0.14, duration: 0.45 }, '-=0.2');
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
