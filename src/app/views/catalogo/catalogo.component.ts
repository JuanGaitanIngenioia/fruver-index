import { Component } from '@angular/core';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent {
  readonly quickFilters = ['Organico', 'En oferta', 'De temporada', 'Local'];

  readonly categories = ['Frutas', 'Verduras', 'Tuberculos', 'Hierbas'];

  readonly products = [
    {
      name: 'Tomate chonto',
      category: 'Verduras',
      price: '2.950',
      unit: 'kg',
      trend: 'up',
      change: '3.2%',
      emoji: '🍅'
    },
    {
      name: 'Banano',
      category: 'Frutas',
      price: '1.840',
      unit: 'kg',
      trend: 'down',
      change: '5.1%',
      emoji: '🍌'
    },
    {
      name: 'Papa sabanera',
      category: 'Tuberculos',
      price: '2.430',
      unit: 'kg',
      trend: 'up',
      change: '2.4%',
      emoji: '🥔'
    },
    {
      name: 'Cilantro',
      category: 'Hierbas',
      price: '1.120',
      unit: 'mano',
      trend: 'down',
      change: '7.9%',
      emoji: '🌿'
    },
    {
      name: 'Mango tommy',
      category: 'Frutas',
      price: '3.350',
      unit: 'kg',
      trend: 'down',
      change: '4.3%',
      emoji: '🥭'
    },
    {
      name: 'Zanahoria',
      category: 'Verduras',
      price: '1.980',
      unit: 'kg',
      trend: 'up',
      change: '1.6%',
      emoji: '🥕'
    }
  ];
}
