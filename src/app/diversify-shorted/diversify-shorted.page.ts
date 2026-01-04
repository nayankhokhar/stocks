import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface SipMetrics {
  investment: string;
  value: string;
  gain: string;
  return: string;
  xirr: string;
  avg: string;
}

interface ReturnMetrics {
  cagr: string;
  avg: string;
  xirr: string;
  abs: string;
  startNav: string;
  endNav: string;
  dailySip: SipMetrics;
  monthlySip: SipMetrics;
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
    // { code: '122639', name: 'Parag Parikh Flexi Cap Fund', expenseRatio: '0.66%', exitLoad: '2% for < 365 days' },
    // { code: '120828', name: 'Quant Active Fund', expenseRatio: '0.58%', exitLoad: 'Nil' },
    // { code: '120465', name: 'Nippon India Small Cap Fund', expenseRatio: '0.70%', exitLoad: '1% for < 30 days' },
    // { code: '119063', name: 'SBI Nifty 50 ETF', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '120621', name: 'ICICI Prudential Infrastructure Fund - Direct Plan - Growth', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '120586', name: 'ICICI Prudential Large Cap Fund', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '120821', name: 'quant Multi Asset Allocation Fund-GROWTH OPTION-Direct Plan', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '147662', name: 'ICICI Prudential Commodities Fund - Direct Plan - Growth Option', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '129188', name: 'Invesco India - Invesco Global Equity Income Fund of Fund - Direct Plan - Growth', expenseRatio: '0.07%', exitLoad: 'Nil' },
    { code: '119723', name: 'SBI ELSS Tax Saver FUND - DIRECT PLAN -GROWTH', expenseRatio: '0.07%', exitLoad: 'Nil' }
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
              oneYear: this.getEmptyMetrics(),
              threeYear: this.getEmptyMetrics(),
              fiveYear: this.getEmptyMetrics(),
              total: this.getEmptyMetrics()
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

  getEmptyMetrics(): ReturnMetrics {
    const emptySip = { investment: '-', value: '-', gain: '-', return: '-', xirr: '-', avg: '-' };
    return { cagr: '-', avg: '-', xirr: '-', abs: '-', startNav: '-', endNav: '-', dailySip: emptySip, monthlySip: emptySip };
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
      const record = processedData.find(d => d.date <= targetDate);

      if (!record || periodYears <= 0) return this.getEmptyMetrics();

      // 1. CAGR (Annual Return) -> Point to Point
      // Formula: (Current/Old)^(1/n) - 1
      const cagrVal = (Math.pow(currentNav / record.nav, 1 / periodYears) - 1) * 100;

      // 2. Average Return -> Absolute / Years
      // Formula: ((Current - Old) / Old * 100) / Years
      const absReturn = ((currentNav - record.nav) / record.nav) * 100;
      const avgVal = absReturn / periodYears;

      // 3. XIRR -> SIP Scenario
      const xirrVal = this.calculateSIPXIRR(processedData, targetDate, currentDate, currentNav);

      // 4. Daily SIP (100)
      const dailySipVal = this.calculateSIPValue(processedData, targetDate, currentDate, currentNav, 100, 'daily');

      // 5. Monthly SIP (2000)
      const monthlySipVal = this.calculateSIPValue(processedData, targetDate, currentDate, currentNav, 2000, 'monthly');

      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      return {
        cagr: cagrVal.toFixed(2) + '%',
        avg: avgVal.toFixed(2) + '%',
        xirr: xirrVal !== null ? xirrVal.toFixed(2) + '%' : 'N/A',
        abs: absReturn.toFixed(2) + '%',
        startNav: '₹' + record.nav.toFixed(2) + ' (' + formatDate(record.date) + ')',
        endNav: '₹' + currentNav.toFixed(2) + ' (' + formatDate(currentDate) + ')',
        dailySip: dailySipVal,
        monthlySip: monthlySipVal
      };
    };

    if (fund.performance) {
      fund.performance.oneYear = calcForPeriod(1);
      fund.performance.threeYear = calcForPeriod(3);
      fund.performance.fiveYear = calcForPeriod(5);
      fund.performance.total = calcForPeriod('total');
    }
  }

  calculateSIPValue(data: any[], startDate: Date, endDate: Date, currentNav: number, amount: number, frequency: 'daily' | 'monthly'): SipMetrics {
    let totalUnits = 0;
    let totalInvestment = 0;
    const cashFlows: { amount: number, date: Date }[] = [];

    if (frequency === 'daily') {
      // Iterate all records between startDate and endDate in descending data
      for (const record of data) {
        if (record.date >= startDate && record.date < endDate) {
          totalUnits += amount / record.nav;
          totalInvestment += amount;
          cashFlows.push({ amount: -amount, date: record.date });
        }
        if (record.date < startDate) break;
      }
    } else {
      // Monthly
      let dateIter = new Date(startDate);
      while (dateIter < endDate) {
        const record = data.find(d => d.date <= dateIter);
        if (record) {
          totalUnits += amount / record.nav;
          totalInvestment += amount;
          cashFlows.push({ amount: -amount, date: record.date }); // Use record date for accuracy or dateIter? Record date is safer for nav match
        }
        dateIter.setMonth(dateIter.getMonth() + 1);
      }
    }

    const currentValue = totalUnits * currentNav;
    const gain = currentValue - totalInvestment;
    const absReturn = totalInvestment > 0 ? (gain / totalInvestment) * 100 : 0;

    // Calculate XIRR
    // Add final value as positive cashflow
    const xirrFlows = [...cashFlows, { amount: currentValue, date: endDate }];
    const xirrVal = this.computeXIRR(xirrFlows);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationInYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    const avgReturn = durationInYears > 0 ? absReturn / durationInYears : 0;

    // Formatting helper
    const fmt = (num: number) => '₹' + Math.round(num).toLocaleString('en-IN');

    return {
      investment: fmt(totalInvestment),
      value: fmt(currentValue),
      gain: fmt(gain),
      return: absReturn.toFixed(2) + '%',
      xirr: xirrVal !== null ? xirrVal.toFixed(2) + '%' : 'N/A',
      avg: avgReturn.toFixed(2) + '%'
    };
  }

  // Calculate XIRR for a standard Monthly SIP scenario
  calculateSIPXIRR(data: any[], startDate: Date, endDate: Date, currentNav: number): number | null {
    const cashFlows: { amount: number, date: Date }[] = [];
    const sipAmount = 1000;
    let totalUnits = 0;
    let dateIter = new Date(startDate);

    while (dateIter < endDate) {
      const record = data.find(d => d.date <= dateIter);
      if (record) {
        const nav = record.nav;
        const units = sipAmount / nav;
        totalUnits += units;
        cashFlows.push({ amount: -sipAmount, date: new Date(dateIter) });
      }
      dateIter.setMonth(dateIter.getMonth() + 1);
    }

    if (cashFlows.length === 0) return null;

    const finalValue = totalUnits * currentNav;
    cashFlows.push({ amount: finalValue, date: endDate });

    return this.computeXIRR(cashFlows);
  }

  // Newton-Raphson method to calculate XIRR
  computeXIRR(cashFlows: { amount: number, date: Date }[], guess = 0.1): number | null {
    const maxIterations = 100;
    const tolerance = 1e-6;
    let rate = guess;

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
        return rate * 100;
      }

      if (Math.abs(d_npv) < 1e-10) break;

      const newRate = rate - npv / d_npv;
      if (!isFinite(newRate)) break;
      rate = newRate;
    }
    return null;
  }
}
