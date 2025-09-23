import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InsiderTradingPageRoutingModule } from './insider-trading-routing.module';

import { InsiderTradingPage } from './insider-trading.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InsiderTradingPageRoutingModule
  ],
  declarations: [InsiderTradingPage]
})
export class InsiderTradingPageModule {}
