import { Component } from '@angular/core';

@Component({
  selector: 'app-historicos',
  standalone: true,
  templateUrl: './historicos.component.html',
  styleUrl: './historicos.component.scss'
})
export class HistoricosComponent {
  readonly ranges = ['1S', '1M', '1A', '5A'];
}
