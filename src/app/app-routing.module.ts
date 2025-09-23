import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'stocks',
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
  {
    path: 'portfolio',
    loadChildren: () => import('./portfolio/portfolio.module').then( m => m.PortfolioPageModule)
  },
  {
    path: 'insider-trading',
    loadChildren: () => import('./insider-trading/insider-trading.module').then( m => m.InsiderTradingPageModule)
  },
  {
    path: 'stocks',
    loadChildren: () => import('./stocks/stocks.module').then( m => m.StocksPageModule)
  },




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
