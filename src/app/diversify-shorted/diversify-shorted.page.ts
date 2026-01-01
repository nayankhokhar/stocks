import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface ReturnMetrics {
  cagr: string;
  avg: string;
  xirr: string;
}

interface MutualFund {
  code: string;
  name: string;
  expenseRatio?: string;
  exitLoad?: string;
  meta?: any;
  performance?: {
    oneYear: ReturnMetrics;
    threeYear: ReturnMetrics;
    fiveYear: ReturnMetrics;
    total: ReturnMetrics;
  };
}

@Component({
  selector: 'app-diversify-shorted',
  templateUrl: './diversify-shorted.page.html',
  styleUrls: ['./diversify-shorted.page.scss'],
  standalone: false
})
export class DiversifyShortedPage implements OnInit {

  bestFunds: MutualFund[] = [
    { code: '122639', name: 'Parag Parikh Flexi Cap Fund', expenseRatio: '0.66%', exitLoad: '2% for < 365 days' },
    { code: '120828', name: 'Quant Active Fund', expenseRatio: '0.58%', exitLoad: 'Nil' },
    { code: '120465', name: 'Nippon India Small Cap Fund', expenseRatio: '0.70%', exitLoad: '1% for < 30 days' },
    { code: '119063', name: 'SBI Nifty 50 ETF', expenseRatio: '0.07%', exitLoad: 'Nil' }
  ];

  allFundsData: MutualFund[] = [];
  isLoading = false;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchAllFunds();
  }

  fetchAllFunds() {
    this.isLoading = true;
    this.allFundsData = [];

    const requests = this.bestFunds.map(fund => {
      const url = `https://api.mfapi.in/mf/${fund.code}`;
      return this.http.get<any>(url).pipe(
        map(res => {
          const processedFund: MutualFund = {
            ...fund,
            name: res.meta ? res.meta.scheme_name : fund.name,
            meta: res.meta,
            performance: { // Initialize with empty defaults
              oneYear: { cagr: '-', avg: '-', xirr: '-' },
              threeYear: { cagr: '-', avg: '-', xirr: '-' },
              fiveYear: { cagr: '-', avg: '-', xirr: '-' },
              total: { cagr: '-', avg: '-', xirr: '-' }
            }
          };

          if (res.data && res.data.length > 0) {
            this.calculateReturns(processedFund, res.data);
          }

          return processedFund;
        })
      );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        this.allFundsData = results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching funds', err);
        this.isLoading = false;
      }
    });
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }

  calculateReturns(fund: MutualFund, data: any[]) {
    // API data is descending (latest first)
    // Format: dd-mm-yyyy transform to Date objects for easier handling
    const processedData = data.map(d => {
      const parts = d.date.split('-');
      return {
        date: new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])),
        nav: parseFloat(d.nav)
      };
    });

    const currentRecord = processedData[0];
    const currentNav = currentRecord.nav;
    const currentDate = currentRecord.date;

    const calcForPeriod = (years: number | 'total'): ReturnMetrics => {
      let targetDate: Date;
      let periodYears: number;

      if (years === 'total') {
        const inceptionRecord = processedData[processedData.length - 1];
        targetDate = inceptionRecord.date;
        const diffTime = Math.abs(currentDate.getTime() - inceptionRecord.date.getTime());
        periodYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      } else {
        targetDate = new Date(currentDate);
        targetDate.setFullYear(targetDate.getFullYear() - (years as number));
        periodYears = years as number;
      }

      // Find closest record in history that is <= targetDate
      // processedData is descending new -> old
      // We want the newest date that is still older than targetDate? 
      // Or strictly the date closest to targetDate? 
      // Usually, point-to-point uses the NAV on that exact date or previous available.
      // Since list is descending, we search from start until we find date <= target
      const record = processedData.find(d => d.date <= targetDate);

      if (!record || periodYears <= 0) return { cagr: 'N/A', avg: 'N/A', xirr: 'N/A' };

      // 1. CAGR (Annual Return) -> Point to Point
      // Formula: (Current/Old)^(1/n) - 1
      const cagrVal = (Math.pow(currentNav / record.nav, 1 / periodYears) - 1) * 100;

      // 2. Average Return -> Absolute / Years
      // Formula: ((Current - Old) / Old * 100) / Years
      const absReturn = ((currentNav - record.nav) / record.nav) * 100;
      const avgVal = absReturn / periodYears;

      // 3. XIRR -> SIP Scenario
      // Generate monthly dates from targetDate to currentDate
      const xirrVal = this.calculateSIPXIRR(processedData, targetDate, currentDate, currentNav);

      return {
        cagr: cagrVal.toFixed(2) + '%',
        avg: avgVal.toFixed(2) + '%',
        xirr: xirrVal !== null ? xirrVal.toFixed(2) + '%' : 'N/A'
      };
    };

    if (fund.performance) {
      fund.performance.oneYear = calcForPeriod(1);
      fund.performance.threeYear = calcForPeriod(3);
      fund.performance.fiveYear = calcForPeriod(5);
      fund.performance.total = calcForPeriod('total');
    }
  }

  // Calculate XIRR for a standard Monthly SIP scenario
  calculateSIPXIRR(data: any[], startDate: Date, endDate: Date, currentNav: number): number | null {
    const cashFlows: { amount: number, date: Date }[] = [];
    const sipAmount = 1000;
    let totalUnits = 0;
    let dateIter = new Date(startDate);

    // We assume SIP on the same day of the month as startDate
    // If data is missing for that day, use the closest previous data point
    // Iterate monthly
    while (dateIter < endDate) {
      // Find NAV for dateIter
      // Data is descending. We need closest date <= dateIter.
      // Since we are moving forward in time, we can optimize or just linear search usually fast enough
      const record = data.find(d => d.date <= dateIter);

      if (record) {
        const nav = record.nav;
        const units = sipAmount / nav;
        totalUnits += units;
        cashFlows.push({ amount: -sipAmount, date: new Date(dateIter) });
      }

      // Increment month
      dateIter.setMonth(dateIter.getMonth() + 1);
    }

    // If no cashflows, return null
    if (cashFlows.length === 0) return null;

    // Final Value
    const finalValue = totalUnits * currentNav;
    cashFlows.push({ amount: finalValue, date: endDate });

    return this.computeXIRR(cashFlows);
  }

  // Newton-Raphson method to calculate XIRR
  computeXIRR(cashFlows: { amount: number, date: Date }[], guess = 0.1): number | null {
    const maxIterations = 100;
    const tolerance = 1e-6;
    let rate = guess;

    // Normalize dates to fraction of years from first date
    const firstDate = cashFlows[0].date;
    const flows = cashFlows.map(cf => ({
      amount: cf.amount,
      years: (cf.date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    }));

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let d_npv = 0;

      for (const flow of flows) {
        const factor = Math.pow(1 + rate, flow.years);
        npv += flow.amount / factor;
        d_npv -= (flow.years * flow.amount) / (factor * (1 + rate));
      }

      if (Math.abs(npv) < tolerance) {
        return rate * 100; // Return percentage
      }

      if (Math.abs(d_npv) < 1e-10) break; // Avoid division by zero

      const newRate = rate - npv / d_npv;
      if (!isFinite(newRate)) break;
      rate = newRate;
    }
    return null;
  }
}
