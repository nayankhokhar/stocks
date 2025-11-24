import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MutualFundPageRoutingModule } from './mutual-fund-routing.module';

import { MutualFundPage } from './mutual-fund.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MutualFundPageRoutingModule
  ],
  declarations: [MutualFundPage]
})
export class MutualFundPageModule {}
