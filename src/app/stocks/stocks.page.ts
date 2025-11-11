import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.page.html',
  styleUrls: ['./stocks.page.scss'],
  standalone: false
})
export class StocksPage implements OnInit {
  stocks: any = [];
  sectors: any[] = [];
  selectedSectors: any[] = [];

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.http.get<any>("http://localhost:8888/getStocksSector").subscribe((resp) => {
      this.sectors = resp.map((item: any) => item._id);
    });

    this.http.post<any[]>("http://localhost:8888/getStocks", {
      sector: this.selectedSectors
    }).subscribe((resp) => {
      console.log("resp: ",resp);
    });
  }

  onSectorSelect(event: any) {
    this.http.post<any[]>("http://localhost:8888/getStocksData", {
      sector: this.selectedSectors
    }).subscribe((resp) => {
      this.stocks = _.orderBy(resp, ['totalGreenCount'], ['desc']);
    });
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '-';
  }
}
