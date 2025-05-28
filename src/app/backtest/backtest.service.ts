import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class BacktestService {
  private buyMaxCycle: number = -1;
  private buyMaxOrders: number = 7;
  private pipValue: number = 0.01; // 1 pip = 0.01 for XAUUSD
  private nextOrderInMinutes: number = 5; // Default: wait 5 minutes between orders (adjust as needed)
  private buyLotSizes: number[] = [0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05]; // Lot sizes for each order
  private buyPipSeries: number[] = [3, 5, 8, 13, 21, 34, 55]; // Pip distances for each order
  private buyProfitMultiplier: number[] = [1.0, 1.0, 1.0, 1.5, 1.5, 1.5, 1.5]; // Profit multipliers for each order

  processTickData(file: File): Promise<any> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e:any) => {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const tickData = XLSX.utils.sheet_to_json(worksheet);

        const result = this.runBacktest(tickData);
        resolve(result);
      };
      reader.readAsArrayBuffer(file);
    });
  }

   runBacktest(tickData: any[]): any {
    let currentCycleNumber = 0;
    let buyCompletedCycle = 0;
    let buyOpenOrders: any[] = [];
    const tradeHistory: any[] = [];
    let ticketCounter = 1;
    let equity = 0;
    let peakEquity = 0;
    let maxDrawdown = 0;
    let totalProfit = 0;
    let winningTrades = 0;
    let totalTrades = 0;
    let cycleTrades: any[] = [];
    let lastBuyIdx = 0; // Track the index of the last buy order in the cycle
    let firstOrderOpenPrice = 0; // Track the first order's open price in the cycle for TP

    for (const tick of tickData) {
      const bid = parseFloat(tick['Bid']);
      const ask = parseFloat(tick['Ask']);
      const timestamp = new Date(tick['Timestamp']);

      if (buyOpenOrders.length === 0) {
        currentCycleNumber++;
        lastBuyIdx = 0; // Reset index for new cycle
        if (this.buyMaxCycle !== -1 && currentCycleNumber > this.buyMaxCycle) {
          break;
        }

        // Open the first order of the cycle
        firstOrderOpenPrice = ask;
        buyOpenOrders.push({
          ticket: ticketCounter++,
          type: 'BUY',
          openPrice: ask,
          lotSize: this.buyLotSizes[0], // Use lot size for first order
          stopLoss: 0,
          takeProfit: firstOrderOpenPrice + (312 * this.pipValue), // TP at first order's price + 312 pips
          openTime: timestamp,
          cycleNumber: currentCycleNumber,
          orderIdx: lastBuyIdx // Track the order index for profit multiplier
        });
      }

      // Check for closing orders
      for (let i = buyOpenOrders.length - 1; i >= 0; i--) {
        const order = buyOpenOrders[i];
        if (bid >= order.takeProfit || (order.stopLoss !== 0 && bid <= order.stopLoss)) {
          const closePrice = bid >= order.takeProfit ? order.takeProfit : order.stopLoss;
          const baseProfit = (closePrice - order.openPrice) * order.lotSize * 100; // Base profit for XAUUSD
          const profit = baseProfit * this.buyProfitMultiplier[order.orderIdx]; // Apply profit multiplier
          totalProfit += profit;
          equity += profit;
          peakEquity = Math.max(peakEquity, equity);
          const drawdown = peakEquity - equity;
          maxDrawdown = Math.max(maxDrawdown, drawdown);

          totalTrades++;
          if (profit > 0) winningTrades++;

          tradeHistory.push({
            ticket: order.ticket,
            type: order.type,
            openPrice: order.openPrice,
            closePrice: closePrice,
            lotSize: order.lotSize,
            stopLoss: order.stopLoss,
            takeProfit: order.takeProfit,
            openTime: order.openTime,
            closeTime: timestamp,
            profit: profit,
            cycleNumber: order.cycleNumber
          });

          cycleTrades.push({ profit: profit, cycleNumber: order.cycleNumber });
          buyOpenOrders.splice(i, 1);
        }
      }

      // Check for opening new orders
      if (buyOpenOrders.length > 0 && buyOpenOrders.length < this.buyMaxOrders) {
        if (this.checkNextOrderEligibility(buyOpenOrders, ask, timestamp, lastBuyIdx)) {
          lastBuyIdx++; // Increment the index for the next order
          buyOpenOrders.push({
            ticket: ticketCounter++,
            type: 'BUY',
            openPrice: ask,
            lotSize: this.buyLotSizes[lastBuyIdx], // Use lot size based on order index
            stopLoss: 0,
            takeProfit: firstOrderOpenPrice + (312 * this.pipValue), // Same TP as first order
            openTime: timestamp,
            cycleNumber: currentCycleNumber,
            orderIdx: lastBuyIdx // Track the order index for profit multiplier
          });
        }
      }

      // End of cycle
      if (buyOpenOrders.length === 0) {
        buyCompletedCycle++;
        const cycleProfit = this.calculateCycleProfit(cycleTrades, currentCycleNumber);
        tradeHistory.push({
          isCycleEnd: true,
          cycleNumber: currentCycleNumber,
          cycleProfit: cycleProfit
        });
        cycleTrades = [];
      }
    }

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalTrades,
      totalProfit,
      winRate,
      maxDrawdown,
      tradeHistory,
      buyCompletedCycle
    };
  }

  private calculateCycleProfit(cycleTrades: any[], cycleNumber: number): number {
    const cycleTradesForNumber = cycleTrades.filter(trade => trade.cycleNumber === cycleNumber);
    return cycleTradesForNumber.reduce((sum, trade) => sum + trade.profit, 0);
  }

  private checkNextOrderEligibility(openOrders: any[], currentAsk: number, currentTime: Date, lastBuyIdx: number): boolean {
    // Get the last order
    const lastOrder = openOrders[openOrders.length - 1];
    const lastBuyPrice = lastOrder.openPrice;
    const lastBuyOrderOpenTime = lastOrder.openTime;

    // Calculate the pip distance in price terms
    const pipDistanceInPrice = this.buyPipSeries[lastBuyIdx] * this.pipValue; // e.g., 3 pips * 0.01 = 0.03

    // Price condition: current ask must be at least pipDistance below last buy price
    const priceCondition = currentAsk <= lastBuyPrice - pipDistanceInPrice;

    if (this.nextOrderInMinutes > 0) {
      // Time condition: enough time must have passed since the last order
      const timeDiffInSeconds = (currentTime.getTime() - lastBuyOrderOpenTime.getTime()) / 1000; // Convert ms to seconds
      const timeCondition = timeDiffInSeconds > (this.nextOrderInMinutes * 60);
      return priceCondition && timeCondition;
    } else {
      return priceCondition;
    }
  }
}