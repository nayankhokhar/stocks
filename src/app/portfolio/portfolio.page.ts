import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: false
})
export class PortfolioPage implements OnInit {
  portfolio: any = [
    {
      name: "The Tata Power Company Ltd.",
      holding: [
        { qty: 5, date: "26-03-2025", price: 378.90 }
      ],
      fundamentalAPI: "TPC"
    },
    {
      name: "Ircon International Ltd.",
      holding: [
        { qty: 19, date: "25-07-2024", price: 288.60 },
        { qty: 6, date: "06-08-2024", price: 273.50 },
        { qty: 3, date: "19-08-2024", price: 270.65 },
        { qty: 19, date: "20-08-2024", price: 266.65 },
        { qty: 9, date: "18-09-2024", price: 234.35 },
        { qty: 21, date: "19-09-2024", price: 220.20 },
        { qty: 22, date: "07-10-2024", price: 208.99 },
        { qty: 30, date: "14-01-2025", price: 186.85 },
      ],
      fundamentalAPI: "II21"
    },
    {
      name: "GM Breweries Ltd.",
      holding: [
        { qty: 2, date: "15-04-2025", price: 1301.80 }
      ],
      fundamentalAPI: "GMB"
    },
    {
      name: "Indian Oil Corporation Ltd.",
      holding: [
        { qty: 14, date: "23-05-2025", price: 145.15 }
      ],
      fundamentalAPI: "IOC"
    },
    {
      name: "NHPC Ltd.",
      holding: [
        { qty: 23, date: "22-05-2025", price: 88.24 }
      ],
      fundamentalAPI: "N07"
    },
    {
      name: "Power Finance Corporation Ltd.",
      holding: [
        { qty: 5, date: "21-05-2025", price: 406.45 }
      ],
      fundamentalAPI: "N07"
    },
    {
      name: "Anant Raj Ltd.",
      holding: [
        { qty: 2, date: "28-04-2025", price: 460.10 },
        { qty: 2, date: "22-04-2025", price: 513.50 }
      ],
      fundamentalAPI: "ARI"
    },
    {
      name: "DLF",
      holding: [
        { qty: 3, date: "21-05-2025", price: 772.00 }
      ],
      fundamentalAPI: "D04"
    },
    // {
    //   name: "Ntpc Green Energy Ltd.",
    //   holding: [
    //     { qty: 20, date: "06-05-2025", price: 100.59 }
    //   ],
    //   fundamentalAPI: "NGE"
    // },
    {
      name: "Hindustan Zinc",
      holding: [
        { qty: 4, date: "27-06-2025", price: 453.45 }
      ],
      fundamentalAPI: "HZ"
    },
    // {
    //   name: "Kings Infra Ventures",
    //   holding: [
    //     { qty: 8, date: "10-06-2025", price: 131.95 }
    //   ],
    //   fundamentalAPI: "VAF01"
    // },
    // {
    //   name: "Indian Ren. Energy",
    //   holding: [
    //     { qty: 12, date: "27-05-2025", price: 172.10 }
    //   ],
    //   fundamentalAPI: "IREDAL"
    // },
    {
      name: "Bombay Burmah Trdg.",
      holding: [
        { qty: 1, date: "10-06-2025", price: 2015.00 }
      ],
      fundamentalAPI: "BBT"
    },
    {
      name: "Tata Motors",
      holding: [
        { qty: 11, date: "03-10-2024", price: 933.35 },
        { qty: 1, date: "29-10-2024", price: 841.00 },
        { qty: 1, date: "25-02-2025", price: 671.30 },
        { qty: 5, date: "27-03-2025", price: 673.20 },
      ],
      fundamentalAPI: "TEL"
    }
  ];

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.processHoldings();
  }

  processHoldings(): void {
    const dividendFetches = this.portfolio.map((item: any) => this.extractDividendsData(item.fundamentalAPI));

    Promise.all(dividendFetches).then(() => {
      this.portfolio.forEach((item: any) => {
        let totalQty = 0;
        let totalCost = 0;
        let totalDividend = 0;

        item.holding.forEach((h: any) => {
          totalQty += h.qty;
          totalCost += h.qty * h.price;

          h?.dividends?.forEach((div: any) => {
            totalDividend += Number(div.totalDividends);
          });
        });

        item.totalQty = totalQty;
        item.totalInvestment = Number(totalCost).toFixed(2);
        item.avgPrice = Number(totalQty > 0 ? (totalCost / totalQty) : 0).toFixed(2);
        item.totalDividend = Number(totalDividend).toFixed(2);
        item.totalDividendPercentage = totalCost > 0
          ? ((totalDividend / totalCost) * 100).toFixed(2)
          : '0.00';
      });
    });
    console.log(this.portfolio);
  }


  extractDividendsData(name: string): Promise<void> {
    const dividendUrl = `https://api.moneycontrol.com/mcapi/v1/stock/corporate-action?deviceType=W&scId=${name}&section=d&start=0&limit=20`;

    return new Promise((resolve, reject) => {
      this.http.get<any>(dividendUrl).subscribe({
        next: (res) => {
          this.portfolio.forEach((portfolioItem: any) => {
            if (portfolioItem.fundamentalAPI === name) {
              let upcomingDividends: any[] = [];

              portfolioItem.holding.forEach((holding: any) => {
                const holdingDate = new Date(this.parseDate(holding.date));
                holding.dividends = [];

                res.data.dividends.forEach((dividend: any) => {
                  const effectiveDate = new Date(this.parseDate(dividend.effective_date));
                  const dividendAmount = Number(dividend.dividend_amount);
                  const dividendPercentage = Number(((dividendAmount / holding.price) * 100).toFixed(2));
                  const totalDividend = Number(holding.qty * dividendAmount).toFixed(2);

                  if (effectiveDate < new Date() && effectiveDate > holdingDate) {
                    holding.dividends.push({
                      effective_date: dividend.effective_date,
                      dividend_per_share_percentage: dividendPercentage,
                      dividend_amount: dividendAmount,
                      totalDividends: totalDividend,
                      is_upcoming: false
                    });
                  }

                  if (effectiveDate > new Date()) {
                    upcomingDividends.push({
                      effective_date: dividend.effective_date,
                      dividend_per_share_percentage: dividendPercentage,
                      dividend_amount: dividendAmount,
                      totalDividends: totalDividend,
                      effectiveDate,
                      price_per_share: holding.price
                    });
                  }
                });
              });

              if (upcomingDividends.length > 0) {
                upcomingDividends.sort((a, b) => a.effectiveDate - b.effectiveDate);
                const next = upcomingDividends[0];

                portfolioItem.upcoming_dividend_date = next.effective_date;
                portfolioItem.upcoming_dividend_percentage = next.dividend_per_share_percentage;
                portfolioItem.upcoming_dividend_price_per_share = next.dividend_amount;
                portfolioItem.upcoming_dividend_total_dividends = next.totalDividends;
              }
            }
          });

          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }


  // Helper function to parse dates in DD-MM-YYYY or DD MMM, YYYY format
  private parseDate(dateStr: string): Date {
    // Handle DD-MM-YYYY format
    if (dateStr.includes('-')) {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Handle DD MMM, YYYY format
    const [day, monthStr, year] = dateStr.split(' ');
    const month = new Date(`${monthStr} 1, 2000`).getMonth();
    return new Date(Number(year), month, Number(day.replace(',', '')));
  }
}
