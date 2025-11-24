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
  investmentTill: number;       // daily SIP invested till year-end
  unitsTill: number;            // daily SIP units till year-end
  navAtYearEnd: number;
  currentValueTill: number;
  growthTill: number;
  growthPctTill: number;
  annualisedReturn: number | null; // SIP XIRR percent

  // data (price) per-year
  dataStartNav?: number | null;
  dataEndNav?: number | null;
  dataReturnPct?: number | null;
  dataAnnualisedPct?: number | null;

  // monthly SIP fields
  monthlyInvestmentTill?: number;
  monthlyUnitsTill?: number;
  monthlyCurrentValueTill?: number;
  monthlyGrowthTill?: number;
  monthlyAnnualisedReturn?: number | null;
}

interface MonthlyRecord {
  year: number;
  month: number; // 1-12
  date: string;  // first date used for month in dd-mm-yyyy
  nav: number;
  monthlyUnits: number;
}

@Component({
  selector: 'app-mutual-fund',
  templateUrl: './mutual-fund.page.html',
  styleUrls: ['./mutual-fund.page.scss'],
  standalone: false
})
export class MutualFundPage implements OnInit {
  records: MfRecord[] = [];

  // defaults (you can change in the UI)
  investPerDay = 100;
  investPerMonth = 2000;

  // date range defaults (yyyy-mm-dd)
  startDate = '';
  endDate = '';

  // totals (daily SIP)
  totalDays = 0;
  totalInvested = 0;
  totalUnits = 0;
  latestNav = 0;
  currentValue = 0;
  totalGain = 0;
  gainPercent = 0;

  // monthly SIP results
  monthlyRecords: MonthlyRecord[] = [];
  monthlyTotalMonths = 0;
  monthlyTotalInvested = 0;
  monthlyTotalUnits = 0;
  monthlyCurrentValue = 0;
  monthlyTotalGain = 0;
  monthlyGainPercent = 0;
  monthlyAnnualisedReturn: number | null = null;

  yearSummaries: YearSummary[] = [];
  portfolioAnnualisedReturn: number | null = null;

  // data-only (buy & hold) overall
  firstNav = 0;
  lastNav = 0;
  firstDate = '';
  lastDate = '';
  dataTotalReturn: number | null = null;      // percent
  dataAnnualisedReturn: number | null = null; // percent (CAGR)

  // fund meta from resp.meta
  fundMeta: any = null;

  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  /** Called from Submit button */
  onSubmit() {
    // basic validation
    if (!this.startDate || !this.endDate) {
      this.error = 'Please provide both start and end dates.';
      return;
    }
    if (this.startDate > this.endDate) {
      this.error = 'Start date must be before or equal to end date.';
      return;
    }
    // clear previous error and fetch
    this.error = null;
    this.fetchData();
  }

  /** Main fetch - uses this.startDate and this.endDate and current invest amounts */
  fetchData() {
    this.loading = true;
    this.error = null;

    // API expects yyyy-mm-dd for startDate/endDate params
    const start = this.startDate;
    const end = this.endDate;

    const url = `https://api.mfapi.in/mf/120621?startDate=${start}&endDate=${end}`;

    this.http.get<any>(url)
      .subscribe({
        next: (resp) => {
          if (!resp || !resp.data || !Array.isArray(resp.data)) {
            this.error = 'Invalid response from API';
            this.loading = false;
            return;
          }

          // store meta for UI
          this.fundMeta = resp.meta || null;

          // copy into local array (latest-first expected)
          this.records = resp.data.map((r: any) => ({
            date: r.date,
            nav: r.nav
          }));

          // add dailyUnitPurchase using current investPerDay
          this.records = this.records.map((item) => {
            const nav = parseFloat(item.nav);
            const dailyUnits = (isFinite(nav) && nav > 0) ? (this.investPerDay / nav) : 0;
            return {
              ...item,
              dailyUnitPurchase: dailyUnits
            };
          });

          // compute SIP totals (daily)
          this.totalDays = this.records.length;
          this.totalInvested = this.totalDays * this.investPerDay;
          this.totalUnits = this.records.reduce((acc, it) => acc + (it.dailyUnitPurchase || 0), 0);

          // latest NAV (first record)
          this.latestNav = this.records.length > 0 ? parseFloat(this.records[0].nav) : 0;
          this.currentValue = this.totalUnits * this.latestNav;

          this.totalGain = this.currentValue - this.totalInvested;
          this.gainPercent = this.totalInvested > 0 ? (this.totalGain / this.totalInvested) * 100 : 0;

          // build year-wise summary (SIP) and include data returns per year and monthly snapshots
          this.yearSummaries = this.buildYearlySummaryWithDataAndMonthly(this.records, this.investPerDay, this.investPerMonth);

          // compute portfolio annualised return using XIRR (SIP daily)
          this.portfolioAnnualisedReturn = this.computePortfolioAnnualisedReturn(this.records, this.investPerDay, this.currentValue, this.records[0]?.date);

          // compute data-only overall returns (buy 1 unit at first NAV -> hold to last NAV)
          this.computeDataOverallReturns(this.records);

          // compute monthly SIP results (overall) using current investPerMonth
          this.computeMonthlySip(this.records, this.investPerMonth);

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
   * Build year-wise cumulative summary (SIP) and attach data-only returns per year and monthly SIP cumulative snapshots.
   */
  private buildYearlySummaryWithDataAndMonthly(records: MfRecord[], investPerDay = 100, investPerMonth = 100): YearSummary[] {
    if (!records || records.length === 0) return [];

    // oldest-first for chronological processing
    const oldestFirst = [...records].reverse();

    // --- prepare monthly first-of-month list (chronological) ---
    const monthMap = new Map<string, MfRecord>();
    for (const r of oldestFirst) {
      const parts = (r.date || '').split('-');
      if (parts.length !== 3) continue;
      const key = `${parts[2]}-${parts[1]}`; // yyyy-mm
      if (!monthMap.has(key)) monthMap.set(key, r); // first chronological gets stored
    }
    const monthlyFirsts = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(e => e[1]);

    // --- per-year daily-SIP cumulative snapshots and data per-year first/last NAV ---
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
        entry.firstNavInYear = nav;
      }
      entry.lastNavInYear = nav;
      entry.lastDateOfYear = r.date;

      map.set(year, entry);
    }

    // build summaries in ascending year order
    const years = Array.from(map.keys()).sort((a, b) => a - b);
    const summaries: YearSummary[] = [];

    for (const y of years) {
      const snap = map.get(y)!;

      // daily SIP cumulative
      const investmentTill = snap.cumulativeDays * investPerDay;
      const unitsTill = snap.cumulativeUnits;
      const navAtYearEnd = snap.lastNavInYear || 0;
      const currentValueTill = unitsTill * navAtYearEnd;
      const growthTill = currentValueTill - investmentTill;
      const growthPctTill = investmentTill > 0 ? (growthTill / investmentTill) * 100 : 0;

      // SIP XIRR up to year-end
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
      const dataStartNav = snap.firstNavInYear;
      const dataEndNav = snap.lastNavInYear;
      if (dataStartNav !== null && dataEndNav !== null && dataStartNav > 0) {
        dataReturnPct = ((dataEndNav - dataStartNav) / dataStartNav) * 100;

        const firstDateStr = this.findFirstDateInYear(oldestFirst, y);
        if (firstDateStr) {
          const dFirst = this.parseDateFromDDMMYYYY(firstDateStr).getTime();
          const dLast = this.parseDateFromDDMMYYYY(snap.lastDateOfYear).getTime();
          const yearsFraction = Math.max((dLast - dFirst) / (1000 * 3600 * 24 * 365), 0);
          if (yearsFraction > 0) {
            dataAnnualisedPct = (Math.pow((dataEndNav / dataStartNav), 1 / yearsFraction) - 1) * 100;
          } else {
            dataAnnualisedPct = null;
          }
        } else {
          dataAnnualisedPct = null;
        }
      }

      // --- Monthly cumulative up to year-end ---
      // months with yyyy <= y from monthlyFirsts
      const monthsUpToYear = monthlyFirsts.filter(m => {
        const parts = (m.date || '').split('-');
        if (parts.length !== 3) return false;
        const my = parseInt(parts[2], 10);
        return my <= y;
      });

      let monthlyUnitsTill = 0;
      let monthlyInvestmentTill = 0;
      let lastMonthlyDateForYear = '';
      for (const m of monthsUpToYear) {
        const navm = parseFloat(m.nav as any);
        if (!isFinite(navm) || navm <= 0) continue;
        monthlyUnitsTill += investPerMonth / navm;
        monthlyInvestmentTill += investPerMonth;
        lastMonthlyDateForYear = m.date;
      }
      const monthlyCurrentValueTill = monthlyUnitsTill * navAtYearEnd;
      const monthlyGrowthTill = monthlyCurrentValueTill - monthlyInvestmentTill;

      // monthly XIRR up to year-end
      let monthlyAnnualisedReturn: number | null = null;
      if (monthsUpToYear.length > 0) {
        const flowsMonthly: { date: string; amount: number }[] = [];
        // chronological monthsUpToYear are already chronological from monthlyFirsts
        for (const m of monthsUpToYear) {
          flowsMonthly.push({ date: m.date, amount: -investPerMonth });
        }
        // terminal positive on year-end last date
        const terminalDate = snap.lastDateOfYear || monthsUpToYear[monthsUpToYear.length - 1].date;
        flowsMonthly.push({ date: terminalDate, amount: monthlyCurrentValueTill });

        const xirrM = this.xirr(flowsMonthly);
        monthlyAnnualisedReturn = xirrM === null ? null : xirrM * 100;
      } else {
        monthlyAnnualisedReturn = null;
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

        dataStartNav: dataStartNav || null,
        dataEndNav: dataEndNav || null,
        dataReturnPct,
        dataAnnualisedPct,

        monthlyInvestmentTill,
        monthlyUnitsTill,
        monthlyCurrentValueTill,
        monthlyGrowthTill,
        monthlyAnnualisedReturn
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

  /**
   * Compute monthly SIP overall (first NAV of each month).
   */
  private computeMonthlySip(records: MfRecord[], investPerMonth: number) {
    this.monthlyRecords = [];
    this.monthlyTotalMonths = 0;
    this.monthlyTotalInvested = 0;
    this.monthlyTotalUnits = 0;
    this.monthlyCurrentValue = 0;
    this.monthlyTotalGain = 0;
    this.monthlyGainPercent = 0;
    this.monthlyAnnualisedReturn = null;

    if (!records || records.length === 0) return;

    // oldest-first
    const oldestFirst = [...records].reverse();

    // first-of-month map
    const monthMap = new Map<string, MfRecord>();
    for (const r of oldestFirst) {
      const parts = (r.date || '').split('-');
      if (parts.length !== 3) continue;
      const key = `${parts[2]}-${parts[1]}`;
      if (!monthMap.has(key)) monthMap.set(key, r);
    }

    const monthlyFirsts = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(e => e[1]);

    for (const r of monthlyFirsts) {
      const nav = parseFloat(r.nav as any);
      if (!isFinite(nav) || nav <= 0) continue;
      const parts = r.date.split('-');
      const year = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      const units = investPerMonth / nav;
      this.monthlyRecords.push({ year, month, date: r.date, nav, monthlyUnits: units });
      this.monthlyTotalUnits += units;
      this.monthlyTotalInvested += investPerMonth;
    }

    this.monthlyTotalMonths = this.monthlyRecords.length;
    this.monthlyCurrentValue = this.monthlyTotalUnits * this.latestNav;
    this.monthlyTotalGain = this.monthlyCurrentValue - this.monthlyTotalInvested;
    this.monthlyGainPercent = this.monthlyTotalInvested > 0 ? (this.monthlyTotalGain / this.monthlyTotalInvested) * 100 : 0;

    // monthly flows -> XIRR
    const flows: { date: string; amount: number }[] = [];
    for (const m of this.monthlyRecords) flows.push({ date: m.date, amount: -investPerMonth });
    const terminalDate = this.records[0]?.date || (this.monthlyRecords[this.monthlyRecords.length - 1]?.date);
    flows.push({ date: terminalDate, amount: this.monthlyCurrentValue });

    const xirrMonthly = this.xirr(flows);
    this.monthlyAnnualisedReturn = xirrMonthly === null ? null : xirrMonthly * 100;
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

  private parseDateFromDDMMYYYY(s: string): Date {
    const p = (s || '').split('-');
    return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '-';
  }
}
