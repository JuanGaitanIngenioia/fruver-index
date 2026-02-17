import { afterNextRender, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly topNav = viewChild<ElementRef<HTMLElement>>('topNav');
  private readonly footerEl = viewChild<ElementRef<HTMLElement>>('footerEl');

  private tl: gsap.core.Timeline | null = null;

  constructor() {
    afterNextRender(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const nav = this.topNav()?.nativeElement;
      const footer = this.footerEl()?.nativeElement;

      if (prefersReduced) {
        if (nav) gsap.set(nav, { opacity: 1, y: 0 });
        if (footer) gsap.set(footer, { opacity: 1, y: 0 });
        return;
      }

      this.tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (nav) {
        this.tl.from(nav, { opacity: 0, y: -24, duration: 0.5 });

        const logo = nav.querySelector('.logo');
        const links = nav.querySelectorAll('.nav-links a');

        if (logo) this.tl.from(logo, { opacity: 0, x: -16, duration: 0.4 }, '-=0.3');
        if (links.length) this.tl.from(links, { opacity: 0, y: -8, stagger: 0.07, duration: 0.3 }, '-=0.2');
      }

      if (footer) {
        this.tl.from(footer, { opacity: 0, y: 16, duration: 0.4 }, '-=0.1');
      }
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
