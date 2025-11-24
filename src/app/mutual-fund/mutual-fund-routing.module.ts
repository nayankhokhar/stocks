import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MutualFundPage } from './mutual-fund.page';

const routes: Routes = [
  {
    path: '',
    component: MutualFundPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MutualFundPageRoutingModule {}
