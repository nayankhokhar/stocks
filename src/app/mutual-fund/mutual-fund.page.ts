import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

interface MfRecord {
  date: string;            // "dd-mm-yyyy"
  nav: string;
  dailyUnitPurchase?: number;
}

interface SipTransaction {
  date: string;
  nav: number;
  amount: number;
  units: number;
}

interface WeeklyByWeekday {
  weekday: string; // 'Mon'..'Fri'
  investmentTill: number;
  unitsTill: number;
  currentValueTill: number;
  growthTill: number;
  annualisedReturn?: number | null;
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

  // weekly (Monday) fields (cumulative up to year)
  weeklyInvestmentTill?: number;
  weeklyUnitsTill?: number;
  weeklyCurrentValueTill?: number;
  weeklyGrowthTill?: number;
  weeklyAnnualisedReturn?: number | null;

  // new: per-weekday breakdown
  weeklyByWeekday?: Record<string, WeeklyByWeekday>;
}

interface MonthlyRecord {
  year: number;
  month: number; // 1-12
  date: string;  // first date used for month in dd-mm-yyyy
  nav: number;
  monthlyUnits: number;
}

interface WeeklySummaryRow {
  weekday: string; // 'Mon'..'Fri'
  totalInvested: number;
  totalUnits: number;
  currentValue: number;
  totalGain: number;
  gainPercent: number;
  annualisedReturn: number | null;
  weeksCount: number;
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
  investPerWeek = 500;
  investPerMonth = 2000;

  // date range defaults (yyyy-mm-dd)
  startDate = '1990-01-01';
  endDate = '2025-11-25';

  // scheme code (default)
  schemeCode = 120621;

  // search UI
  searchTerm = '';
  searchResults: { schemeCode: number; schemeName: string }[] = [];
  searchLoading = false;
  searchError: string | null = null;

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

  // weekly comparison summary (Mon..Fri)
  weeklySummary: WeeklySummaryRow[] = [];

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

  constructor(private http: HttpClient, private modalController: ModalController) { }

  ngOnInit() {
    // initial load using defaults
    this.fetchData();
  }

  // ---------------- Search methods ----------------
  onSearch() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.searchError = 'Enter search term';
      return;
    }
    this.searchError = null;
    this.searchLoading = true;
    this.searchResults = [];

    const q = encodeURIComponent(this.searchTerm.trim());
    const url = `https://api.mfapi.in/mf/search?q=${q}`;

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        this.searchLoading = false;
        if (!Array.isArray(resp)) {
          this.searchError = 'Unexpected search response';
          return;
        }
        this.searchResults = resp.map((r: any) => ({ schemeCode: r.schemeCode, schemeName: r.schemeName }));
      },
      error: (err) => {
        console.error(err);
        this.searchLoading = false;
        this.searchError = 'Search failed';
      }
    });
  }

  selectScheme(s: { schemeCode: number; schemeName: string }) {
    // set scheme and fetch data for it
    this.schemeCode = s.schemeCode;
    // optional: set tentative fundMeta so UI shows picked name while loading
    this.fundMeta = { scheme_name: s.schemeName, fund_house: '-', scheme_category: '-', scheme_type: '-' };
    // clear search results
    this.searchResults = [];
    // fetch NAVs for selected scheme
    this.fetchData();
  }

  // ---------------- Submit / Fetch ----------------
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
    this.error = null;
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = null;

    // API expects yyyy-mm-dd for startDate/endDate params
    const start = this.startDate || '2020-01-01';
    const end = this.endDate || '2025-11-25';

    const url = `https://api.mfapi.in/mf/${this.schemeCode}?startDate=${start}&endDate=${end}`;

    this.http.get<any>(url)
      .subscribe({
        next: (resp) => {
          if (!resp || !resp.data || !Array.isArray(resp.data)) {
            this.error = 'Invalid response from API';
            this.loading = false;
            return;
          }

          // store meta for UI (API returns meta)
          this.fundMeta = resp.meta || this.fundMeta || null;

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

          // Populate daily details
          this.dailyDetails = this.records.map(r => {
            const nav = parseFloat(r.nav);
            return {
              date: r.date,
              nav: nav,
              amount: this.investPerDay,
              units: (isFinite(nav) && nav > 0) ? (this.investPerDay / nav) : 0
            };
          }).reverse(); // Make chronological (oldest first)

          // build year-wise summary (SIP) and include data returns per year and monthly snapshots (weekly Mon included)
          this.yearSummaries = this.buildYearlySummaryWithDataAndMonthly(this.records, this.investPerDay, this.investPerMonth, this.investPerWeek);

          // compute portfolio annualised return using XIRR (SIP daily)
          this.portfolioAnnualisedReturn = this.computePortfolioAnnualisedReturn(this.records, this.investPerDay, this.currentValue, this.records[0]?.date);

          // compute data-only overall returns (buy 1 unit at first NAV -> hold to last NAV)
          this.computeDataOverallReturns(this.records);

          // compute monthly SIP results (overall) using current investPerMonth
          this.computeMonthlySip(this.records, this.investPerMonth);

          // compute weekly SIP variation for Mon..Fri using investPerWeek
          this.weeklySummary = this.computeWeeklySipByWeekday(this.records, this.investPerWeek);

          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to fetch data';
          this.loading = false;
        }
      });
  }

  // ---------- Weekly SIP by weekday ----------
  weeklyDetails: Record<string, SipTransaction[]> = {};
  monthlyDetails: SipTransaction[] = [];
  dailyDetails: SipTransaction[] = [];

  selectedSipDetails: SipTransaction[] = [];
  selectedSipTitle: string = '';
  showDetails = false;

  openDetails(type: string, weekday?: string) {
    this.showDetails = true;
    if (type === 'daily') {
      this.selectedSipTitle = 'Daily SIP Details';
      this.selectedSipDetails = this.dailyDetails;
    } else if (type === 'monthly') {
      this.selectedSipTitle = 'Monthly SIP Details';
      this.selectedSipDetails = this.monthlyDetails;
    } else if (type === 'weekly' && weekday) {
      this.selectedSipTitle = `Weekly SIP (${weekday}) Details`;
      this.selectedSipDetails = this.weeklyDetails[weekday] || [];
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedSipDetails = [];
  }

  private computeWeeklySipByWeekday(records: MfRecord[], investPerWeek: number): WeeklySummaryRow[] {
    const result: WeeklySummaryRow[] = [];
    this.weeklyDetails = {}; // reset

    if (!records || records.length === 0) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => ({
        weekday: d, totalInvested: 0, totalUnits: 0, currentValue: 0, totalGain: 0, gainPercent: 0, annualisedReturn: null, weeksCount: 0
      }));
    }

    // oldest-first
    const oldestFirst = [...records].reverse();

    // Build map of weekStart (Monday ISO) -> list of records in that week (chronological)
    const weekMap = new Map<string, MfRecord[]>();
    for (const r of oldestFirst) {
      const dt = this.parseDateFromDDMMYYYY(r.date);
      const day = dt.getDay(); // 0 Sun .. 6 Sat
      const offsetToMonday = (day + 6) % 7;
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - offsetToMonday);
      const k = this.toYYYYMMDD(monday);
      const arr = weekMap.get(k) || [];
      arr.push(r);
      weekMap.set(k, arr);
    }

    const weekdays = [
      { idx: 1, name: 'Mon' },
      { idx: 2, name: 'Tue' },
      { idx: 3, name: 'Wed' },
      { idx: 4, name: 'Thu' },
      { idx: 5, name: 'Fri' }
    ];

    const weekKeys = Array.from(weekMap.keys()).sort((a, b) => a.localeCompare(b));

    for (const wd of weekdays) {
      let totalInvested = 0;
      let totalUnits = 0;
      const flows: { date: string; amount: number }[] = [];
      const transactions: SipTransaction[] = [];
      let weeksCount = 0;

      for (const wk of weekKeys) {
        const weekRecords = weekMap.get(wk)!; // chronological within week
        let chosen: MfRecord | null = null;
        for (const rec of weekRecords) {
          const dt = this.parseDateFromDDMMYYYY(rec.date);
          const d = dt.getDay(); // 0..6
          const mapped = (d === 0) ? 7 : d; // Sunday=7
          if (mapped === wd.idx) {
            chosen = rec;
            break;
          }
        }
        if (!chosen) continue;
        const nav = parseFloat(chosen.nav);
        if (!isFinite(nav) || nav <= 0) continue;
        weeksCount++;
        totalInvested += investPerWeek;
        const units = investPerWeek / nav;
        totalUnits += units;
        flows.push({ date: chosen.date, amount: -investPerWeek });

        transactions.push({
          date: chosen.date,
          nav: nav,
          amount: investPerWeek,
          units: units
        });
      }

      this.weeklyDetails[wd.name] = transactions;

      const lastDate = this.records[0]?.date || (weekKeys.length ? weekMap.get(weekKeys[weekKeys.length - 1])![0].date : null);
      const terminalAmount = totalUnits * (this.latestNav || 0);
      if (lastDate) flows.push({ date: lastDate, amount: terminalAmount });

      const x = this.xirr(flows);
      const annualisedReturn = x === null ? null : x * 100;

      const currentValue = totalUnits * (this.latestNav || 0);
      const totalGain = currentValue - totalInvested;
      const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

      result.push({
        weekday: wd.name,
        totalInvested,
        totalUnits,
        currentValue,
        totalGain,
        gainPercent,
        annualisedReturn,
        weeksCount
      });
    }

    return result;
  }

  // ---------- Yearly + monthly + weekly builder (per-weekday breakdown) ----------
  private buildYearlySummaryWithDataAndMonthly(records: MfRecord[], investPerDay = 100, investPerMonth = 100, investPerWeek = 500): YearSummary[] {
    if (!records || records.length === 0) return [];

    const oldestFirst = [...records].reverse();

    // --- monthly first-of-month list (chronological) ---
    const monthMap = new Map<string, MfRecord>();
    for (const r of oldestFirst) {
      const parts = (r.date || '').split('-');
      if (parts.length !== 3) continue;
      const key = `${parts[2]}-${parts[1]}`; // yyyy-mm
      if (!monthMap.has(key)) monthMap.set(key, r); // first chronological gets stored
    }
    const monthlyFirsts = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(e => e[1]);

    // --- weekly map of week (Monday) -> records in that week ---
    const weekMap = new Map<string, MfRecord[]>();
    for (const r of oldestFirst) {
      const dt = this.parseDateFromDDMMYYYY(r.date);
      const day = dt.getDay();
      const offsetToMonday = (day + 6) % 7;
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - offsetToMonday);
      const k = this.toYYYYMMDD(monday);
      const arr = weekMap.get(k) || [];
      arr.push(r);
      weekMap.set(k, arr);
    }
    const weekKeysAll = Array.from(weekMap.keys()).sort();

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
        for (const m of monthsUpToYear) {
          flowsMonthly.push({ date: m.date, amount: -investPerMonth });
        }
        const terminalDate = snap.lastDateOfYear || monthsUpToYear[monthsUpToYear.length - 1].date;
        flowsMonthly.push({ date: terminalDate, amount: monthlyCurrentValueTill });
        const xirrM = this.xirr(flowsMonthly);
        monthlyAnnualisedReturn = xirrM === null ? null : xirrM * 100;
      } else {
        monthlyAnnualisedReturn = null;
      }

      // --- Weekly (Mon) cumulative up to year-end (quick Mon snapshot) ---
      const weeksUpToYearKeys = weekKeysAll.filter(k => {
        const mondayArr = weekMap.get(k)!;
        if (!mondayArr || mondayArr.length === 0) return false;
        const dYear = parseInt(mondayArr[0].date.split('-')[2], 10);
        return dYear <= y;
      });

      let weeklyUnitsTill = 0;
      let weeklyInvestmentTill = 0;
      let lastWeeklyDateForYear = '';
      for (const wkKey of weeksUpToYearKeys) {
        const arr = weekMap.get(wkKey)!;
        const mondayRec = arr.find(rr => this.parseDateFromDDMMYYYY(rr.date).getDay() === 1);
        if (!mondayRec) continue;
        const navw = parseFloat(mondayRec.nav as any);
        if (!isFinite(navw) || navw <= 0) continue;
        weeklyUnitsTill += investPerWeek / navw;
        weeklyInvestmentTill += investPerWeek;
        lastWeeklyDateForYear = mondayRec.date;
      }
      const weeklyCurrentValueTill = weeklyUnitsTill * navAtYearEnd;
      const weeklyGrowthTill = weeklyCurrentValueTill - weeklyInvestmentTill;

      let weeklyAnnualisedReturn: number | null = null;
      if (weeksUpToYearKeys.length > 0) {
        const flowsWeekly: { date: string; amount: number }[] = [];
        for (const wkKey of weeksUpToYearKeys) {
          const arr = weekMap.get(wkKey)!;
          const mondayRec = arr.find(rr => this.parseDateFromDDMMYYYY(rr.date).getDay() === 1);
          if (!mondayRec) continue;
          flowsWeekly.push({ date: mondayRec.date, amount: -investPerWeek });
        }
        const terminalDate = snap.lastDateOfYear || (weeksUpToYearKeys.length ? (weekMap.get(weeksUpToYearKeys[weeksUpToYearKeys.length - 1])![0].date) : snap.lastDateOfYear);
        flowsWeekly.push({ date: terminalDate, amount: weeklyCurrentValueTill });
        const xirrW = this.xirr(flowsWeekly);
        weeklyAnnualisedReturn = xirrW === null ? null : xirrW * 100;
      } else {
        weeklyAnnualisedReturn = null;
      }

      // --- weekly per-weekday breakdown (Mon..Fri) cumulative up to year-end ---
      const weekdays = [
        { idx: 1, name: 'Mon' },
        { idx: 2, name: 'Tue' },
        { idx: 3, name: 'Wed' },
        { idx: 4, name: 'Thu' },
        { idx: 5, name: 'Fri' }
      ];

      const weeklyByWeekday: Record<string, WeeklyByWeekday> = {};

      for (const wd of weekdays) {
        let inv = 0;
        let units = 0;
        const flowsW: { date: string; amount: number }[] = [];

        for (const wkKey of weekKeysAll) {
          const arr = weekMap.get(wkKey)!;
          if (!arr || arr.length === 0) continue;
          const chosen = arr.find(rr => {
            const d = this.parseDateFromDDMMYYYY(rr.date).getDay();
            const mapped = (d === 0) ? 7 : d;
            return mapped === wd.idx;
          });
          if (!chosen) continue;
          const yOfRec = parseInt(chosen.date.split('-')[2], 10);
          if (yOfRec > y) continue;
          const navc = parseFloat(chosen.nav);
          if (!isFinite(navc) || navc <= 0) continue;
          inv += investPerWeek;
          const u = investPerWeek / navc;
          units += u;
          flowsW.push({ date: chosen.date, amount: -investPerWeek });
        }

        const terminalDate = snap.lastDateOfYear;
        const terminalAmountW = units * navAtYearEnd;
        if (terminalDate) flowsW.push({ date: terminalDate, amount: terminalAmountW });

        const xirrWday = this.xirr(flowsW);
        const annualisedWday = xirrWday === null ? null : xirrWday * 100;

        const currentValW = units * navAtYearEnd;
        const growthW = currentValW - inv;

        weeklyByWeekday[wd.name] = {
          weekday: wd.name,
          investmentTill: inv,
          unitsTill: units,
          currentValueTill: currentValW,
          growthTill: growthW,
          annualisedReturn: annualisedWday
        };
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
        monthlyAnnualisedReturn,

        weeklyInvestmentTill,
        weeklyUnitsTill,
        weeklyCurrentValueTill,
        weeklyGrowthTill,
        weeklyAnnualisedReturn,

        weeklyByWeekday
      });
    }

    return summaries;
  }

  // ---------- helpers ----------
  getWeeklyByWeekdayEntries(y: YearSummary): WeeklyByWeekday[] {
    if (!y.weeklyByWeekday) return [];
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return order.map(k => y.weeklyByWeekday![k] || { weekday: k, investmentTill: 0, unitsTill: 0, currentValueTill: 0, growthTill: 0 });
  }

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

  private computeMonthlySip(records: MfRecord[], investPerMonth: number) {
    this.monthlyRecords = [];
    this.monthlyTotalMonths = 0;
    this.monthlyTotalInvested = 0;
    this.monthlyTotalUnits = 0;
    this.monthlyCurrentValue = 0;
    this.monthlyTotalGain = 0;
    this.monthlyGainPercent = 0;
    this.monthlyAnnualisedReturn = null;
    this.monthlyDetails = []; // reset

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

    // Populate monthly details
    this.monthlyDetails = this.monthlyRecords.map(r => ({
      date: r.date,
      nav: r.nav,
      amount: investPerMonth,
      units: r.monthlyUnits
    }));

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
      // detect dd-mm-yyyy vs yyyy-mm-dd
      if (p.length === 3 && p[0].length === 4) {
        return new Date(`${p[0]}-${p[1]}-${p[2]}`);
      }
      return new Date(`${p[2]}-${p[1]}-${p[0]}`);
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
    if (p.length !== 3) return new Date(s);
    // if first segment is 4 length assume yyyy-mm-dd, else dd-mm-yyyy
    if (p[0].length === 4) return new Date(`${p[0]}-${p[1]}-${p[2]}`);
    return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  private toYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const dd = ('0' + d.getDate()).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }

  async dismissModal(type: string) {
    // Close the modal after date selection
    console.log(`${type} date selected:`, type === 'start' ? this.startDate : this.endDate);
    const modal = await this.modalController.getTop();
    if (modal) {
      await modal.dismiss();
    }
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '-';
  }
}
