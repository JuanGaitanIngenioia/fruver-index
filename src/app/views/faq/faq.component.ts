import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  readonly faqs = [
    {
      question: 'Cada cuanto se actualizan los precios?',
      answer: 'Cada semana con el reporte del DANE.'
    },
    {
      question: 'Como calculan el promedio de la canasta?',
      answer: 'Sumamos el precio de los productos de la canasta familiar y calculamos el promedio.'
    },
    {
      question: 'Puedo registrar mi propio negocio de barrio?',
      answer: 'No.'
    }
  ];
}
