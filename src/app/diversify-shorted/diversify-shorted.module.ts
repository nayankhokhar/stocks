import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DiversifyShortedPageRoutingModule } from './diversify-shorted-routing.module';

import { DiversifyShortedPage } from './diversify-shorted.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiversifyShortedPageRoutingModule
  ],
  declarations: [DiversifyShortedPage]
})
export class DiversifyShortedPageModule {}
