import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'backtest',
    pathMatch: 'full'
  },
  {
    path: 'all-stocks',
    loadChildren: () => import('./all-stocks/all-stocks.module').then(m => m.AllStocksPageModule)
  },
  {
    path: 'backtest',
    loadChildren: () => import('./backtest/backtest.module').then( m => m.BacktestPageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
