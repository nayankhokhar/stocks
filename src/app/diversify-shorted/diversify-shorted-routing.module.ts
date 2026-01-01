import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DiversifyShortedPage } from './diversify-shorted.page';

const routes: Routes = [
  {
    path: '',
    component: DiversifyShortedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiversifyShortedPageRoutingModule {}
