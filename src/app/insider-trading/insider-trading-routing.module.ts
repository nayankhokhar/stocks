import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InsiderTradingPage } from './insider-trading.page';

const routes: Routes = [
  {
    path: '',
    component: InsiderTradingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InsiderTradingPageRoutingModule {}
