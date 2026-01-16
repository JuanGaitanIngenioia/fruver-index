import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly quickFilters = ['Organico', 'En oferta', 'De temporada', 'Local'];

  readonly kpis = [
    {
      title: 'Producto con mayor alza de la semana',
      product: 'Papa criolla',
      detail: '+18% vs semana anterior',
      trend: 'up'
    },
    {
      title: 'Producto con mayor baja',
      product: 'Cebolla larga',
      detail: '-12% (oportunidad de ahorro)',
      trend: 'down'
    }
  ];
}
