import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { CatalogoComponent } from './views/catalogo/catalogo.component';
import { ComparadorComponent } from './views/comparador/comparador.component';
import { HistoricosComponent } from './views/historicos/historicos.component';
import { AcercaComponent } from './views/acerca/acerca.component';
import { FaqComponent } from './views/faq/faq.component';
import { ContactoComponent } from './views/contacto/contacto.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'comparador', component: ComparadorComponent },
  { path: 'historicos', component: HistoricosComponent },
  { path: 'acerca', component: AcercaComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'contacto', component: ContactoComponent }
];
