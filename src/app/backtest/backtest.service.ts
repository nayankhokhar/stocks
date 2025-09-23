import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class BacktestService {
  // Magic numbers
  private buyMagicNumber: number = 3474;
  private sellMagicNumber: number = 4948;

  // Debug flag
  private debug: boolean = false;

  // Trade parameters
  private DynamicPipSeries: boolean = true;
  private BuyBreakEvenTrade: number = 4;
  private BuyBreakEvenHours: number = 6;
  private BuyTimeEnable: boolean = true;
  private ProfitThreshHold: number = 10.0;
  private NextOrderInMinutes: number = 14;
  private SupportSellEnable: boolean = true;
  private SellHedgerStartFromTrade: number = 4;

  // Arrays
  private buyLotSizes: number[] = [0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.08, 0.13, 0.21, 0.34, 0.55, 0.89];
  private buyPipSeries: number[] = [3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
  private buyProfitMultiplier: number[] = [1.0, 1.0, 1.0, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];

  // Cycle parameters
  private buyMaxCycle: number = 6;
  private buyCompletedCycle: number = 0;

  // Tracking variables
  private firstBuyPrice: number = 0.0;
  private firstBuyTicketNo: number = 0;
  private firstBuyTp: number = 0.0;
  private firstBuyOrderOpenTime: Date | null = null;
  private lastBuyPrice: number = 0.0;
  private lastBuyTicketNo: number = 0;
  private lastBuyTp: number = 0.0;
  private lastBuyOrderOpenTime: Date | null = null;
  private LastSellTicketNo: number = 0;
  private lastBuyIdx: number = 0;
  private lotMultiplier: number = 1.0;
  private BuyPriceDifferenceBtnTrade: number = 0.0;
  private IsBreakEvenHoursReached: boolean = false;
  private LastResetDay: number = 0;
  private pipValue: number = 0.01; // 1 pip = 0.01 for XAUUSD
  private spread: number = 0.29; // Placeholder spread in price terms (adjust based on data)

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
    const tradeHistory: any[] = [];
    let ticketCounter = 1;
    let equity = 0;
    let peakEquity = 0;
    let maxDrawdown = 0;
    let totalProfit = 0;
    let winningTrades = 0;
    let totalTrades = 0;
    let cycleTrades: any[] = [];
    let openOrders: any[] = [];

    for (const tick of tickData) {
      const bid = parseFloat(tick['Bid']);
      const ask = parseFloat(tick['Ask']);
      const timestamp = new Date(tick['Timestamp']);

      // Reset buyCompletedCycle on new day if BuyTimeEnable is true
      if (this.BuyTimeEnable && this.getDay(timestamp) !== this.LastResetDay) {
        this.buyCompletedCycle = 0;
        this.LastResetDay = this.getDay(timestamp);
      }

      // Handle buy orders
      const result = this.handleBuyOrder(bid, ask, timestamp, openOrders, tradeHistory, cycleTrades, ticketCounter);
      ticketCounter = result.ticketCounter;

      // Update metrics
      equity = tradeHistory.reduce((sum, trade) => sum + (trade.profit || 0), 0);
      peakEquity = Math.max(peakEquity, equity);
      maxDrawdown = Math.max(maxDrawdown, peakEquity - equity);
      totalTrades = tradeHistory.filter(trade => !trade.isCycleEnd).length;
      winningTrades = tradeHistory.filter(trade => !trade.isCycleEnd && trade.profit > 0).length;
      totalProfit = equity;
    }

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalTrades,
      totalProfit,
      winRate,
      maxDrawdown,
      tradeHistory,
      buyCompletedCycle: this.buyCompletedCycle
    };
  }

  private handleBuyOrder(bid: number, ask: number, timestamp: Date, openOrders: any[], tradeHistory: any[], cycleTrades: any[], ticketCounter: number): { ticketCounter: number } {
    const totalNoOfBuyLot = this.getTotalBuyLot(openOrders);

    // Check if cycle is completed
    if (this.cycleCompleted(totalNoOfBuyLot)) {
      if (this.debug) console.log("Cycle completed");
      return { ticketCounter };
    }

    // Check if within trading hours
    if (this.BuyTimeEnable && this.isTradeTimeValid(totalNoOfBuyLot, timestamp)) {
      return { ticketCounter };
    }

    // If no buy orders, open the first order of a new cycle
    if (totalNoOfBuyLot === 0.0) {
      if (this.debug) console.log("First buy order");

      // Generate buy pip series
      this.generateBuyPipSeries(ask);

      // Reset parameters
      this.resetBuyParameter();
      this.resetBreakEvenParameter();
      this.resetSellParameter();

      if (this.debug) console.log("-----------lastBuyIdx: ", this.lastBuyIdx);

      // Open buy order
      const buyResult = this.placeBuyOrder(ask, timestamp, openOrders, ticketCounter);
      ticketCounter = buyResult.ticketCounter;
    } else {
      // Check for closing orders
      for (let i = openOrders.length - 1; i >= 0; i--) {
        const order = openOrders[i];
        if (order.type === 'BUY' && bid >= order.takeProfit) {
          const closePrice = order.takeProfit;
          const baseProfit = (closePrice - order.openPrice) * order.lotSize * 100;
          const profit = baseProfit * this.buyProfitMultiplier[order.orderIdx];
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
            cycleNumber: this.buyCompletedCycle
          });
          cycleTrades.push({ profit: profit, cycleNumber: this.buyCompletedCycle });
          openOrders.splice(i, 1);
        } else if (order.type === 'SELL' && ask <= order.stopLoss) {
          const closePrice = order.stopLoss;
          const profit = (order.openPrice - closePrice) * order.lotSize * 100;
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
            cycleNumber: this.buyCompletedCycle
          });
          cycleTrades.push({ profit: profit, cycleNumber: this.buyCompletedCycle });
          openOrders.splice(i, 1);
          this.LastSellTicketNo = 0;
        }
      }

      // Check for opening new orders
      if (this.checkNextOrderEligibility(ask, timestamp)) {
        if (this.debug) console.log("----------------------Open next cycle trade");
        const buyResult = this.placeBuyOrder(ask, timestamp, openOrders, ticketCounter);
        ticketCounter = buyResult.ticketCounter;

        // Check if sell support needed
        if (this.SupportSellEnable && this.lastBuyIdx >= this.SellHedgerStartFromTrade && this.LastSellTicketNo === 0) {
          const sellResult = this.handleSellOrder(openOrders, bid, timestamp, ticketCounter);
          ticketCounter = sellResult.ticketCounter;
        }

        this.updateSLAndTP(bid, ask, openOrders);
      }

      // Check hourly break-even
      if (!this.IsBreakEvenHoursReached && this.BuyBreakEvenHours > 0 && this.firstBuyOrderOpenTime) {
        const timeDiffInSeconds = (timestamp.getTime() - this.firstBuyOrderOpenTime.getTime()) / 1000;
        if (timeDiffInSeconds >= this.BuyBreakEvenHours * 3600) {
          if (this.debug) console.log("Hourly Break even hit...: ", bid);
          this.updateSLAndTP(bid, ask, openOrders);
          this.IsBreakEvenHoursReached = true;
        }
      }

      // Handle buy-sell break-even
      if (this.LastSellTicketNo > 0) {
        const breakEvenResult = this.buySellBreakEven(bid, ask, timestamp, openOrders, cycleTrades, tradeHistory, ticketCounter);
        ticketCounter = breakEvenResult.ticketCounter;
      }
    }

    // End of cycle
    if (this.getTotalBuyLot(openOrders) === 0.0 && this.getTotalSellLot(openOrders) === 0.0) {
      const cycleProfit = this.calculateCycleProfit(cycleTrades, this.buyCompletedCycle);
      tradeHistory.push({
        isCycleEnd: true,
        cycleNumber: this.buyCompletedCycle,
        cycleProfit: cycleProfit
      });
      cycleTrades.length = 0; // Reset cycle trades
    }

    return { ticketCounter };
  }

  private placeBuyOrder(ask: number, timestamp: Date, openOrders: any[], ticketCounter: number): { ticketCounter: number } {
    if (this.debug) console.log("---------------Start------------------");

    this.BuyPriceDifferenceBtnTrade = this.lastBuyPrice - ask;
    this.lastBuyPrice = ask;
    // Updated TP calculation: openPrice + (buyPipSeries[lastBuyIdx] * buyProfitMultiplier[lastBuyIdx] * pipValue)
    this.lastBuyTp = this.lastBuyPrice + (this.buyPipSeries[this.lastBuyIdx] * this.buyProfitMultiplier[this.lastBuyIdx] * this.pipValue);

    if (this.debug) {
      console.log("lastBuyPrice: ", this.lastBuyPrice, " lastBuyTp: ", this.lastBuyTp, " lastBuyIdx: ", this.lastBuyIdx, 
                  " buyPipSeries[lastBuyIdx]: ", this.buyPipSeries[this.lastBuyIdx], 
                  " buyProfitMultiplier[lastBuyIdx]: ", this.buyProfitMultiplier[this.lastBuyIdx]);
    }

    const ticket = ticketCounter++;
    openOrders.push({
      ticket: ticket,
      type: 'BUY',
      openPrice: this.lastBuyPrice,
      lotSize: this.buyLotSizes[this.lastBuyIdx] * this.lotMultiplier,
      stopLoss: 0,
      takeProfit: this.lastBuyTp,
      openTime: timestamp,
      cycleNumber: this.buyCompletedCycle,
      orderIdx: this.lastBuyIdx,
      magicNumber: this.buyMagicNumber
    });

    this.lastBuyTicketNo = ticket;

    if (this.firstBuyPrice === 0.0) {
      this.firstBuyPrice = this.lastBuyPrice;
      this.firstBuyTicketNo = ticket;
      this.firstBuyTp = this.lastBuyTp;
      this.firstBuyOrderOpenTime = timestamp;
      this.buyCompletedCycle++;
    }

    this.lastBuyOrderOpenTime = timestamp;
    this.lastBuyIdx++;

    if (this.debug) console.log("BuyOrder:", this.lastBuyIdx, " BuyCycleNo: ", this.buyCompletedCycle);
    if (this.debug) console.log("---------------End------------------");

    return { ticketCounter };
  }

  private checkNextOrderEligibility(currentAsk: number, currentTime: Date): boolean {
    if (!this.lastBuyOrderOpenTime) return false;

    if (this.NextOrderInMinutes > 0) {
      const timeDiffInSeconds = (currentTime.getTime() - this.lastBuyOrderOpenTime.getTime()) / 1000;
      return currentAsk <= this.lastBuyPrice - (this.buyPipSeries[this.lastBuyIdx] * this.pipValue) && 
             timeDiffInSeconds > (this.NextOrderInMinutes * 60);
    } else {
      return currentAsk <= this.lastBuyPrice - (this.buyPipSeries[this.lastBuyIdx] * this.pipValue);
    }
  }

  private updateSLAndTP(bid: number, ask: number, openOrders: any[]) {
    const isBreakEven = this.isBreakEven(openOrders);
    if (this.debug) console.log("Break Even reached");

    if (isBreakEven) {
      if (this.closeAllOrders(bid, ask, openOrders)) {
        if (this.debug) console.log("Close");
        return;
      }

      const buyWeightedPrice = this.getTotalBuyWeightedPrice(openOrders);
      const totalBuyLot = this.getTotalBuyLot(openOrders);

      if (this.LastSellTicketNo !== 0) {
        const sellWeightedPrice = this.getTotalSellWeightedPrice(openOrders);
        const totalSellLot = this.getTotalSellLot(openOrders);
        this.lastBuyTp = (((buyWeightedPrice / totalBuyLot) * totalBuyLot) - 
                         ((sellWeightedPrice / totalSellLot) * totalSellLot)) / (totalBuyLot - totalSellLot) + 
                         (this.spread * 2);
      } else {
        this.lastBuyTp = buyWeightedPrice / totalBuyLot;
      }
    }

    if (!isBreakEven && this.NextOrderInMinutes > 0 && this.lastBuyIdx > 0 && 
        (this.BuyPriceDifferenceBtnTrade - (this.buyPipSeries[this.lastBuyIdx - 1] * this.pipValue)) > this.pipValue) {
      this.lastBuyTp = (this.getTotalBuyWeightedPrice(openOrders) / this.getTotalBuyLot(openOrders)) + 
                       (this.buyPipSeries[this.lastBuyIdx - 1] * this.pipValue);
    }

    for (const order of openOrders) {
      if (order.magicNumber === this.buyMagicNumber && order.type === 'BUY') {
        if (order.takeProfit !== this.lastBuyTp) {
          order.takeProfit = this.lastBuyTp;
        }
      } else if (order.magicNumber === this.sellMagicNumber && order.type === 'SELL') {
        const newSL = this.lastBuyTp + this.spread;
        if (order.stopLoss !== newSL) {
          order.stopLoss = newSL;
        }
      }
    }
  }

  private isBreakEven(openOrders: any[]): boolean {
    const timeCondition = this.BuyBreakEvenHours > 0 && this.firstBuyOrderOpenTime
      ? ((new Date().getTime() - this.firstBuyOrderOpenTime.getTime()) / 1000 >= this.BuyBreakEvenHours * 3600)
      : false;
    return (this.BuyBreakEvenTrade > 0 && this.lastBuyIdx >= this.BuyBreakEvenTrade) || timeCondition;
  }

  private closeAllOrders(bid: number, ask: number, openOrders: any[]): boolean {
    let totalProfit = 0.0;
    for (const order of openOrders) {
      if (order.magicNumber === this.buyMagicNumber && order.type === 'BUY') {
        const profit = (bid - order.openPrice) * order.lotSize * 100 * this.buyProfitMultiplier[order.orderIdx];
        totalProfit += profit;
      } else if (order.magicNumber === this.sellMagicNumber && order.type === 'SELL') {
        const profit = (order.openPrice - ask) * order.lotSize * 100;
        totalProfit += profit;
      }
    }

    if (Math.abs(totalProfit) <= this.ProfitThreshHold) {
      openOrders.length = 0; // Close all orders
      return true;
    }
    return false;
  }

  private handleSellOrder(openOrders: any[], bid: number, timestamp: Date, ticketCounter: number): { ticketCounter: number } {
    const totalBuyLot = this.getTotalBuyLot(openOrders);
    if (totalBuyLot > 0.0) {
      const sellLot = totalBuyLot * 0.5;
      return this.placeSellOrder(sellLot, bid, timestamp, openOrders, ticketCounter);
    } else {
      this.LastSellTicketNo = 0;
      return { ticketCounter };
    }
  }

  private placeSellOrder(sellLot: number, bid: number, timestamp: Date, openOrders: any[], ticketCounter: number): { ticketCounter: number } {
    const ticket = ticketCounter++;
    openOrders.push({
      ticket: ticket,
      type: 'SELL',
      openPrice: bid,
      lotSize: sellLot,
      stopLoss: 0,
      takeProfit: 0,
      openTime: timestamp,
      cycleNumber: this.buyCompletedCycle,
      magicNumber: this.sellMagicNumber
    });

    this.LastSellTicketNo = ticket;
    if (this.debug) console.log("Sell Order start");

    return { ticketCounter };
  }

  private buySellBreakEven(bid: number, ask: number, timestamp: Date, openOrders: any[], cycleTrades: any[], tradeHistory: any[], ticketCounter: number): { ticketCounter: number } {
    let sellTotalProfit = 0.0;
    let sellTotalLot = 0.0;
    let sellOrderIndex = -1;

    for (let i = 0; i < openOrders.length; i++) {
      const order = openOrders[i];
      if (order.ticket === this.LastSellTicketNo && order.type === 'SELL') {
        sellTotalProfit = (order.openPrice - ask) * order.lotSize * 100;
        sellTotalLot = order.lotSize;
        sellOrderIndex = i;
        break;
      }
    }

    for (let i = 0; i < openOrders.length; i++) {
      const order = openOrders[i];
      if (order.magicNumber === this.buyMagicNumber && order.type === 'BUY') {
        const buyProfit = (bid - order.openPrice) * order.lotSize * 100 * this.buyProfitMultiplier[order.orderIdx];
        if (this.debug) console.log("Sell Profit: ", sellTotalProfit);
        if (this.debug) console.log("Buy Profit: ", buyProfit);
        if (this.debug) console.log("MathAbs(SellTotalProfit + BuyProfit): ", Math.abs(sellTotalProfit + buyProfit));

        if (Math.abs(sellTotalProfit + buyProfit) <= this.ProfitThreshHold) {
          // Close buy order
          tradeHistory.push({
            ticket: order.ticket,
            type: order.type,
            openPrice: order.openPrice,
            closePrice: bid,
            lotSize: order.lotSize,
            stopLoss: order.stopLoss,
            takeProfit: order.takeProfit,
            openTime: order.openTime,
            closeTime: timestamp,
            profit: buyProfit,
            cycleNumber: this.buyCompletedCycle
          });
          cycleTrades.push({ profit: buyProfit, cycleNumber: this.buyCompletedCycle });
          openOrders.splice(i, 1);

          // Close sell order
          if (sellOrderIndex !== -1) {
            tradeHistory.push({
              ticket: this.LastSellTicketNo,
              type: 'SELL',
              openPrice: openOrders[sellOrderIndex].openPrice,
              closePrice: ask,
              lotSize: sellTotalLot,
              stopLoss: openOrders[sellOrderIndex].stopLoss,
              takeProfit: openOrders[sellOrderIndex].takeProfit,
              openTime: openOrders[sellOrderIndex].openTime,
              closeTime: timestamp,
              profit: sellTotalProfit,
              cycleNumber: this.buyCompletedCycle
            });
            cycleTrades.push({ profit: sellTotalProfit, cycleNumber: this.buyCompletedCycle });
            openOrders.splice(sellOrderIndex, 1);
          }

          const sellResult = this.handleSellOrder(openOrders, bid, timestamp, ticketCounter);
          ticketCounter = sellResult.ticketCounter;
          this.IsBreakEvenHoursReached = true;
          this.updateSLAndTP(bid, ask, openOrders);
          break;
        }
      }
    }

    return { ticketCounter };
  }

  private generateBuyPipSeries(buyPrice: number) {
    if (this.DynamicPipSeries) {
      this.buyPipSeries = [];
      const BasePrice = 1000.0;
      const pipUnit = 1;
      const CurrentPrice = buyPrice;
      const DynamicStartPip = CurrentPrice / BasePrice;
      const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

      this.buyPipSeries.push(DynamicStartPip);
      for (let i = 1; i < 13; i++) {
        this.buyPipSeries.push(this.buyPipSeries[i - 1] + fib[i] * pipUnit);
      }
    }
  }

  private getTotalBuyLot(openOrders: any[]): number {
    return openOrders
      .filter(order => order.magicNumber === this.buyMagicNumber && order.type === 'BUY')
      .reduce((sum, order) => sum + order.lotSize, 0.0);
  }

  private getTotalBuyWeightedPrice(openOrders: any[]): number {
    return openOrders
      .filter(order => order.magicNumber === this.buyMagicNumber && order.type === 'BUY')
      .reduce((sum, order) => sum + (order.openPrice * order.lotSize), 0.0);
  }

  private getTotalSellLot(openOrders: any[]): number {
    return openOrders
      .filter(order => order.magicNumber === this.sellMagicNumber && order.type === 'SELL')
      .reduce((sum, order) => sum + order.lotSize, 0.0);
  }

  private getTotalSellWeightedPrice(openOrders: any[]): number {
    return openOrders
      .filter(order => order.magicNumber === this.sellMagicNumber && order.type === 'SELL')
      .reduce((sum, order) => sum + (order.openPrice * order.lotSize), 0.0);
  }

  private cycleCompleted(totalNoOfBuyLot: number): boolean {
    return totalNoOfBuyLot === 0.0 && this.buyMaxCycle > 0 && this.buyCompletedCycle >= this.buyMaxCycle;
  }

  private isTradeTimeValid(totalNoOfBuyLot: number, timestamp: Date): boolean {
    const BuyStartHour = 2;
    const BuyStartMinute = 30;
    const BuyCloseHour = 22;
    const BuyCloseMinute = 30;

    const hours = timestamp.getUTCHours();
    const minutes = timestamp.getUTCMinutes();
    const currentMinutes = hours * 60 + minutes;
    const startMinutes = BuyStartHour * 60 + BuyStartMinute;
    const closeMinutes = BuyCloseHour * 60 + BuyCloseMinute;

    return totalNoOfBuyLot === 0.0 && (currentMinutes < startMinutes || currentMinutes > closeMinutes);
  }

  private resetBuyParameter() {
    this.firstBuyPrice = 0.0;
    this.firstBuyTicketNo = 0;
    this.firstBuyTp = 0.0;
    this.firstBuyOrderOpenTime = null;
    this.lastBuyPrice = 0.0;
    this.lastBuyTicketNo = 0;
    this.lastBuyTp = 0.0;
    this.lastBuyOrderOpenTime = null;
  }

  private resetBreakEvenParameter() {
    this.lastBuyIdx = 0;
    this.BuyPriceDifferenceBtnTrade = 0.0;
    this.IsBreakEvenHoursReached = false;
  }

  private resetSellParameter() {
    this.LastSellTicketNo = 0;
  }

  private calculateCycleProfit(cycleTrades: any[], cycleNumber: number): number {
    const cycleTradesForNumber = cycleTrades.filter(trade => trade.cycleNumber === cycleNumber);
    return cycleTradesForNumber.reduce((sum, trade) => sum + trade.profit, 0);
  }

  private getDay(timestamp: Date): number {
    return timestamp.getUTCDate();
  }
}