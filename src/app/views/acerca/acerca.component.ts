import { Component } from '@angular/core';

@Component({
  selector: 'app-acerca',
  standalone: true,
  templateUrl: './acerca.component.html',
  styleUrl: './acerca.component.scss'
})
export class AcercaComponent {
  readonly webhooks = [
    {
      name: 'webhooks/prices/weekly',
      description: 'Actualizaciones semanales de precios por producto y ciudad.'
    },
    {
      name: 'webhooks/products/catalog',
      description: 'Catalogo nacional de productos con unidades y categorias.'
    },
    {
      name: 'webhooks/basket/value',
      description: 'Valor agregado de la canasta familiar por mes.'
    },
    {
      name: 'webhooks/markets/nearby',
      description: 'Mercados cercanos con coordenadas y precios del producto.'
    },
    {
      name: 'webhooks/insights/historical',
      description: 'Insights de estacionalidad y eventos de cosecha.'
    }
  ];
}
