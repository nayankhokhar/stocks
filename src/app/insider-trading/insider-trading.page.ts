import { Component, OnInit } from '@angular/core';
import * as Papa from 'papaparse';
import * as _ from 'lodash';

@Component({
  selector: 'app-insider-trading',
  templateUrl: './insider-trading.page.html',
  styleUrls: ['./insider-trading.page.scss'],
  standalone: false
})
export class InsiderTradingPage implements OnInit {
  private isAllFileProcessed = 0;
  insiderTrading: any = [];
  insiderTradingFiltered: any = [];
  SASTReg29: any = [];
  pledged: any = [];
  shareholdingPatterns: any = [];

  constructor() { }

  ngOnInit() {
  }

  pickFile(event: any) {
    const files: FileList = event.target.files;
    this.isAllFileProcessed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const text = reader.result as string;
          this.convertCSVToJSON(text, file.name);

          this.isAllFileProcessed++;
          if (files.length === this.isAllFileProcessed) {
            this.handleInsiderTrading();
            this.handleSASTReg29();
            this.handlePledgedData();
            this.handleShareholdingPatterns();

            event.target.value = '';
          }
        };
        reader.readAsText(file);
      }
    }
  }

  convertCSVToJSON(csvText: string, fileName: string) {
    Papa.parse(csvText, {
      header: true, // Use the first row as headers
      dynamicTyping: true, // Convert numbers and booleans automatically
      skipEmptyLines: true, // Skip empty lines
      complete: (result: any) => {
        if (fileName.includes('CF-Insider-Trading-equities')) {
          this.insiderTrading = result.data;
        } else if (fileName.includes('CF-SAST- Reg29')) {
          this.SASTReg29 = result.data;
        } else if (fileName.includes('CF-SAST-Pledged-Data')) {
          this.pledged = result.data;
        } else if (fileName.includes('CF-Shareholding-Pattern-equities')) {
          this.shareholdingPatterns = result.data;
        }
      }
    });
  }

  handleInsiderTrading() {
    // Promoters & Promoter Group who buy and sell filter
    const marketPurchaseAndSellRecords = _.filter(this.insiderTrading, (item: any) => ((item['CATEGORY OF PERSON \n'] == "Promoters" || item['CATEGORY OF PERSON \n'] == "Promoter Group") && (item['MODE OF ACQUISITION \n'] == "Market Purchase" || item['MODE OF ACQUISITION \n'] == "Market Sale"))
    );

    // Only buy filter
    const removeSellRecords = _.chain(marketPurchaseAndSellRecords)
      .groupBy('COMPANY \n')
      .filter(group => {
        return !_.some(group, { 'MODE OF ACQUISITION \n': 'Market Sale' });
      }).flatten().value();

    // Step 3: Aggregate by SYMBOL
    const groupedBySymbol = _.groupBy(removeSellRecords, 'SYMBOL \n')

    //Sum by symbol
    const sum = _.map(groupedBySymbol, (records, symbol) => {
      const totalValue = _.sumBy(records, record => Number(record['VALUE OF SECURITY (ACQUIRED/DISPLOSED) \n']) || 0);
      const totalQty = _.sumBy(records, record => Number(record['NO. OF SECURITIES (ACQUIRED/DISPLOSED) \n']) || 0);
      const avgPrice = Number(totalQty ? (totalValue / totalQty) : 0).toFixed(2);
      const companyName = records[0]["COMPANY \n"];

      // Create trimmed transactions
      const transactions = records.map(record => {
        const value = Number(record['VALUE OF SECURITY (ACQUIRED/DISPLOSED) \n']) || 0;
        const qty = Number(record['NO. OF SECURITIES (ACQUIRED/DISPLOSED) \n']) || 0;
        const broadcastDate = record['BROADCASTE DATE AND TIME \n'] || null;
        const avgPrice = Number(qty ? (value / qty) : 0).toFixed(2);

        return { value, qty, broadcastDate, avgPrice };
      });

      const latestBroadcastDate = transactions.length ? transactions[0].broadcastDate : null;

      return {
        symbol,
        companyName,
        totalValue,
        totalQty,
        avgPrice,
        latestBroadcastDate,
        transactions
      };
    });

    this.insiderTradingFiltered = _.orderBy(sum, ['totalValue'], ['desc']);
  }

  handleSASTReg29() {
    const onlySellRecords = _(this.SASTReg29)
      .groupBy('SYMBOL')
      .map((items) => _.some(items, item => item['TOTAL SALE (SHARES/VOTING RIGHTS/WARRANTS/ CONVERTIBLE SECURITIES/ANY OTHER INSTRUMENT)'] > 1) && {
        symbol: items[0].SYMBOL
      })
      .compact()
      .value();

    this.insiderTradingFiltered = _.filter(this.insiderTradingFiltered, (insider) =>
      !_.some(onlySellRecords, { symbol: insider.symbol })
    );
  }

  handlePledgedData() {
    const pledgedRecords = _.filter(this.pledged, (item) => {
      return item["PROMOTER SHARES ENCUMBERED AS OF LAST QUARTER % OF TOTAL SHARES [X/(A+B+C)]"] > 0;
    });

    this.insiderTradingFiltered = _.filter(this.insiderTradingFiltered, (item) => {
      return !_.some(pledgedRecords, { 'NAME OF COMPANY': item.companyName });
    });
  }

  handleShareholdingPatterns() {
    this.insiderTradingFiltered = _.filter(this.insiderTradingFiltered, (insider: any) => {
      const matchingCompany = _.find(this.shareholdingPatterns, { COMPANY: insider.companyName });

      if (matchingCompany) {
        insider.promoterShareHolding = matchingCompany['PROMOTER & PROMOTER GROUP (A)'];
      }
      return true;
    });
  }

  formatIndianCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(amount);
  }

  convertToReadableIndianFormat(value: number): string {
    if (value >= 1e7) { // 1 Cr
      return (value / 1e7).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Cr';
    } else if (value >= 1e5) { // 1 Lac
      return (value / 1e5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Lakh';
    } else if (value >= 1e3) { // 1 Thousand
      return (value / 1e3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' K';
    } else {
      return value.toLocaleString(); // Show full number if below 1K
    }
  }
}
