import { Component } from '@angular/core';

@Component({
  selector: 'app-comparador',
  standalone: true,
  templateUrl: './comparador.component.html',
  styleUrl: './comparador.component.scss'
})
export class ComparadorComponent {
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
      note: 'Mejor precio hoy'
    },
    {
      name: 'Mercado La 80',
      address: 'Cl 80 #75-40, Medellin',
      price: '2.980',
      unit: 'kg',
      distance: '2.1',
      trend: 'up',
      note: 'Subio levemente'
    },
    {
      name: 'Plaza La America',
      address: 'Cl 44 #90-30, Medellin',
      price: '2.850',
      unit: 'kg',
      distance: '3.0',
      trend: 'down',
      note: 'Promedio estable'
    }
  ];
}
