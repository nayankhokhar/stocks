import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllStocksPageRoutingModule } from './all-stocks-routing.module';

import { AllStocksPage } from './all-stocks.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AllStocksPageRoutingModule
  ],
  declarations: [AllStocksPage]
})
export class AllStocksPageModule {}
