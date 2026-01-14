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
  searchStocksData: any = [];
  filteredSearchStocksData: any = [];
  sectors: any[] = [];
  selectedSectors: any[] = [];
  selectedStocks: any[] = [];
  selectedStocksReq: any[] = [];
  searchTerm: string = '';
  showDropdown: boolean = false;

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
      this.searchStocksData = resp;
      this.filteredSearchStocksData = resp; // Initialize filtered list
      console.log("resp: ", resp);
    });
  }

  onSectorSelect(event: any) {
    this.http.post<any[]>("http://localhost:8888/getStocksData", {
      sector: this.selectedSectors,
      id: this.selectedStocksReq
    }).subscribe((resp) => {
      this.stocks = _.orderBy(resp, ['totalGreenCount'], ['desc']);
    });
  }

  // Filter stocks based on search
  filterStocks(event: any) {
    const searchTerm = event.detail.value || '';
    this.searchTerm = searchTerm;

    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredSearchStocksData = this.searchStocksData;
      this.showDropdown = false;
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredSearchStocksData = this.searchStocksData.filter((sector: any) =>
        sector.name.toLowerCase().includes(term)
      );
      this.showDropdown = true;
    }
  }

  // Check if a stock is already selected
  isSelected(sector: any): boolean {
    return this.selectedStocks.some(s => s.name === sector.name);
  }

  // Select a stock from dropdown
  selectStock(sector: any, event?: any) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.isSelected(sector)) {
      this.selectedStocks.push(sector);
    } else {
      // If already selected, remove it (toggle behavior)
      this.removeStock(sector);
    }
    this.searchTerm = '';
    this.showDropdown = false;
    this.filteredSearchStocksData = this.searchStocksData;

    // Convert selectedStocks array to string array of names
    this.selectedStocksReq = this.selectedStocks.map(stock => stock['_id']);

    this.http.post<any[]>("http://localhost:8888/getStocksData", {
      sector: this.selectedSectors,
      id: this.selectedStocksReq
    }).subscribe((resp) => {
      this.stocks = _.orderBy(resp, ['totalGreenCount'], ['desc']);
      console.log(this.stocks);
    });
  }

  // Remove selected stock
  removeStock(stock: any) {
    this.selectedStocks = this.selectedStocks.filter(s => s.name !== stock.name);
  }

  // Handle input blur with delay to allow click
  onInputBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '-';
  }
}
