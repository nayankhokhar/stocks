import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

interface MfRecord {
  date: string;            // "dd-mm-yyyy"
  nav: string;
  dailyUnitPurchase?: number;
}

interface YearSummary {
  year: number;
  daysInYear: number;
  investmentTill: number;
  unitsTill: number;
  navAtYearEnd: number;
  currentValueTill: number;
  growthTill: number;
  growthPctTill: number;
  annualisedReturn: number | null; // SIP XIRR percent
  dataReturnPct?: number | null;    // percent return inside that year (price change)
  dataAnnualisedPct?: number | null; // percent annualised (CAGR) for the year
}

@Component({
  selector: 'app-mutual-fund',
  templateUrl: './mutual-fund.page.html',
  styleUrls: ['./mutual-fund.page.scss'],
  standalone: false
})
export class MutualFundPage implements OnInit {
  records: MfRecord[] = [];
  investPerDay = 100;

  // totals
  totalDays = 0;
  totalInvested = 0;
  totalUnits = 0;
  latestNav = 0;
  currentValue = 0;
  totalGain = 0;
  gainPercent = 0;

  yearSummaries: YearSummary[] = [];
  portfolioAnnualisedReturn: number | null = null;

  // data-only (buy & hold) overall
  firstNav = 0;
  lastNav = 0;
  firstDate = '';
  lastDate = '';
  dataTotalReturn: number | null = null;      // percent
  dataAnnualisedReturn: number | null = null; // percent (CAGR)

  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = null;

    this.http.get<any>('https://api.mfapi.in/mf/120621?startDate=2020-11-26&endDate=2025-11-21')
      .subscribe({
        next: (resp) => {
          if (!resp || !resp.data || !Array.isArray(resp.data)) {
            this.error = 'Invalid response from API';
            this.loading = false;
            return;
          }

          // copy into local array (latest-first expected)
          this.records = resp.data.map((r: any) => ({
            date: r.date,
            nav: r.nav
          }));

          // add dailyUnitPurchase to each record
          this.records = this.records.map((item) => {
            const nav = parseFloat(item.nav);
            const dailyUnits = (isFinite(nav) && nav > 0) ? (this.investPerDay / nav) : 0;
            return {
              ...item,
              dailyUnitPurchase: dailyUnits
            };
          });

          // compute SIP totals
          this.totalDays = this.records.length;
          this.totalInvested = this.totalDays * this.investPerDay;
          this.totalUnits = this.records.reduce((acc, it) => acc + (it.dailyUnitPurchase || 0), 0);

          // latest NAV (first record)
          this.latestNav = this.records.length > 0 ? parseFloat(this.records[0].nav) : 0;
          this.currentValue = this.totalUnits * this.latestNav;

          this.totalGain = this.currentValue - this.totalInvested;
          this.gainPercent = this.totalInvested > 0 ? (this.totalGain / this.totalInvested) * 100 : 0;

          // build year-wise summary (SIP) and include data returns per year
          this.yearSummaries = this.buildYearlySummaryWithDataReturns(this.records, this.investPerDay);

          // compute portfolio annualised return using XIRR (SIP)
          this.portfolioAnnualisedReturn = this.computePortfolioAnnualisedReturn(this.records, this.investPerDay, this.currentValue, this.records[0]?.date);

          // compute data-only overall returns (buy 1 unit at first NAV -> hold to last NAV)
          this.computeDataOverallReturns(this.records);

          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to fetch data';
          this.loading = false;
        }
      });
  }

  /**
   * Build year-wise cumulative summary (SIP) and attach data-only returns per year (price returns).
   */
  private buildYearlySummaryWithDataReturns(records: MfRecord[], investPerDay = 100): YearSummary[] {
    if (!records || records.length === 0) return [];

    // oldest-first order for cumulative sums and per-year first/last
    const oldestFirst = [...records].reverse();

    // track per-year values
    const map = new Map<number, {
      daysInYear: number;
      cumulativeDays: number;
      cumulativeUnits: number;
      firstNavInYear: number | null;
      lastNavInYear: number | null;
      lastDateOfYear: string;
    }>();

    let cumulativeDays = 0;
    let cumulativeUnits = 0;

    for (const r of oldestFirst) {
      const parts = (r.date || '').split('-');
      if (parts.length !== 3) continue;
      const year = parseInt(parts[2], 10);

      const nav = parseFloat(r.nav as any);
      if (!isFinite(nav) || nav <= 0) continue;

      cumulativeDays += 1;
      cumulativeUnits += investPerDay / nav;

      const entry = map.get(year) || {
        daysInYear: 0,
        cumulativeDays: 0,
        cumulativeUnits: 0,
        firstNavInYear: null,
        lastNavInYear: null,
        lastDateOfYear: ''
      };

      entry.daysInYear += 1;
      entry.cumulativeDays = cumulativeDays;
      entry.cumulativeUnits = cumulativeUnits;

      if (entry.firstNavInYear === null) {
        entry.firstNavInYear = nav; // first chronological in that year
      }
      // overwrite lastNavInYear each time, so it becomes the last one in the year
      entry.lastNavInYear = nav;
      entry.lastDateOfYear = r.date;

      map.set(year, entry);
    }

    // build summaries ascending year order
    const years = Array.from(map.keys()).sort((a, b) => a - b);
    const summaries: YearSummary[] = [];

    for (const y of years) {
      const snap = map.get(y)!;
      const investmentTill = snap.cumulativeDays * investPerDay;
      const unitsTill = snap.cumulativeUnits;
      const navAtYearEnd = snap.lastNavInYear || 0;
      const currentValueTill = unitsTill * navAtYearEnd;
      const growthTill = currentValueTill - investmentTill;
      const growthPctTill = investmentTill > 0 ? (growthTill / investmentTill) * 100 : 0;

      // SIP XIRR (annualised) up to year-end
      const flowsSip: { date: string; amount: number }[] = [];
      for (const r of oldestFirst) {
        const p = r.date.split('-');
        const ry = parseInt(p[2], 10);
        if (ry > y) break;
        flowsSip.push({ date: r.date, amount: -investPerDay });
      }
      flowsSip.push({ date: snap.lastDateOfYear, amount: currentValueTill });
      const xirrSip = this.xirr(flowsSip);
      const annualisedReturnSip = xirrSip === null ? null : xirrSip * 100;

      // Data (price) returns inside the year
      let dataReturnPct: number | null = null;
      let dataAnnualisedPct: number | null = null;
      if (snap.firstNavInYear !== null && snap.lastNavInYear !== null && snap.firstNavInYear > 0) {
        dataReturnPct = ((snap.lastNavInYear - snap.firstNavInYear) / snap.firstNavInYear) * 100;

        // find first date string for this year (chronological)
        const firstDateStr = this.findFirstDateInYear(oldestFirst, y);
        if (firstDateStr) {
          const dFirst = this.parseDateFromDDMMYYYY(firstDateStr).getTime();
          const dLast = this.parseDateFromDDMMYYYY(snap.lastDateOfYear).getTime();
          const yearsFraction = Math.max((dLast - dFirst) / (1000 * 3600 * 24 * 365), 0);
          if (yearsFraction > 0) {
            dataAnnualisedPct = (Math.pow((snap.lastNavInYear / snap.firstNavInYear), 1 / yearsFraction) - 1) * 100;
          } else {
            dataAnnualisedPct = null; // single-day year or zero duration
          }
        } else {
          dataAnnualisedPct = null;
        }
      }

      summaries.push({
        year: y,
        daysInYear: snap.daysInYear,
        investmentTill,
        unitsTill,
        navAtYearEnd,
        currentValueTill,
        growthTill,
        growthPctTill,
        annualisedReturn: annualisedReturnSip,
        dataReturnPct,
        dataAnnualisedPct
      });
    }

    return summaries;
  }

  /**
   * Compute overall data buy-and-hold returns (1 unit bought at first NAV -> value at last NAV).
   */
  private computeDataOverallReturns(records: MfRecord[]) {
    if (!records || records.length === 0) {
      this.firstNav = this.lastNav = 0;
      this.firstDate = this.lastDate = '';
      this.dataTotalReturn = null;
      this.dataAnnualisedReturn = null;
      return;
    }

    const oldestFirst = [...records].reverse();
    const first = oldestFirst[0];
    const last = oldestFirst[oldestFirst.length - 1];

    const firstNav = parseFloat(first.nav);
    const lastNav = parseFloat(last.nav);

    this.firstNav = isFinite(firstNav) ? firstNav : 0;
    this.lastNav = isFinite(lastNav) ? lastNav : 0;
    this.firstDate = first.date;
    this.lastDate = last.date;

    if (this.firstNav > 0 && this.lastNav > 0) {
      this.dataTotalReturn = ((this.lastNav - this.firstNav) / this.firstNav) * 100;

      const dFirst = this.parseDateFromDDMMYYYY(this.firstDate).getTime();
      const dLast = this.parseDateFromDDMMYYYY(this.lastDate).getTime();
      const years = Math.max((dLast - dFirst) / (1000 * 3600 * 24 * 365), 0);
      if (years > 0) {
        this.dataAnnualisedReturn = (Math.pow((this.lastNav / this.firstNav), 1 / years) - 1) * 100;
      } else {
        this.dataAnnualisedReturn = null;
      }
    } else {
      this.dataTotalReturn = null;
      this.dataAnnualisedReturn = null;
    }
  }

  private findFirstDateInYear(oldestFirst: MfRecord[], year: number): string | null {
    for (const r of oldestFirst) {
      const parts = (r.date || '').split('-');
      if (parts.length !== 3) continue;
      const y = parseInt(parts[2], 10);
      if (y === year) return r.date;
      if (y > year) return null; // since oldestFirst sorted, if passed year return null
    }
    return null;
  }

  // ---------- XIRR implementation ----------
  private computePortfolioAnnualisedReturn(records: MfRecord[], investPerDay: number, finalValue: number, lastDateStr?: string): number | null {
    if (!records || records.length === 0) return null;
    const oldestFirst = [...records].reverse();
    const flows: { date: string; amount: number }[] = [];
    for (const r of oldestFirst) flows.push({ date: r.date, amount: -investPerDay });
    const terminalDate = lastDateStr || records[0].date;
    flows.push({ date: terminalDate, amount: finalValue });
    const x = this.xirr(flows);
    return x === null ? null : x * 100;
  }

  private xirr(flows: { date: string; amount: number }[]): number | null {
    const hasPos = flows.some(f => f.amount > 0);
    const hasNeg = flows.some(f => f.amount < 0);
    if (!hasPos || !hasNeg) return null;

    const parseDate = (s: string) => {
      const p = s.split('-');
      return new Date(`${p[2]}-${p[1]}-${p[0]}`); // yyyy-mm-dd
    };

    const baseDate = parseDate(flows[0].date).getTime();
    const yrs = flows.map(f => (parseDate(f.date).getTime() - baseDate) / (1000 * 3600 * 24 * 365));
    const amounts = flows.map(f => f.amount);

    const npv = (rate: number) => {
      let s = 0;
      for (let i = 0; i < amounts.length; i++) {
        s += amounts[i] / Math.pow(1 + rate, yrs[i]);
      }
      return s;
    };

    let low = -0.9999;
    let high = 10;
    let fLow = npv(low);
    let fHigh = npv(high);

    let iterExpand = 0;
    while (fLow * fHigh > 0 && iterExpand < 50) {
      high *= 2;
      fHigh = npv(high);
      iterExpand++;
    }
    if (fLow * fHigh > 0) {
      // fallback Newton-Raphson attempt
      try {
        let guess = 0.1;
        for (let i = 0; i < 100; i++) {
          let f = 0;
          let df = 0;
          for (let j = 0; j < amounts.length; j++) {
            const denom = Math.pow(1 + guess, yrs[j]);
            f += amounts[j] / denom;
            df += -amounts[j] * yrs[j] / (denom * (1 + guess));
          }
          if (Math.abs(f) < 1e-8) return guess;
          if (Math.abs(df) < 1e-12) break;
          guess = guess - f / df;
          if (!isFinite(guess)) break;
        }
      } catch (e) {
        return null;
      }
      return null;
    }

    let a = low, b = high, fa = fLow, fb = fHigh, mid = 0;
    for (let i = 0; i < 100; i++) {
      mid = (a + b) / 2;
      const fm = npv(mid);
      if (Math.abs(fm) < 1e-9) break;
      if (fa * fm < 0) { b = mid; fb = fm; } else { a = mid; fa = fm; }
    }
    if (!isFinite(mid)) return null;
    return mid;
  }

  // ---------- helpers ----------
  private parseDateFromDDMMYYYY(s: string): Date {
    const p = (s || '').split('-');
    return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '-';
  }
}
