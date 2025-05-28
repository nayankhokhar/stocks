import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BacktestPageRoutingModule } from './backtest-routing.module';

import { BacktestPage } from './backtest.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BacktestPageRoutingModule
  ],
  declarations: [BacktestPage]
})
export class BacktestPageModule {}
