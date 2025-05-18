import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllStocksPage } from './all-stocks.page';

const routes: Routes = [
  {
    path: '',
    component: AllStocksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllStocksPageRoutingModule {}
