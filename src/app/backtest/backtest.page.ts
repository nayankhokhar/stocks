import { Component, OnInit } from '@angular/core';
import { BacktestService } from './backtest.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-backtest',
  templateUrl: './backtest.page.html',
  styleUrls: ['./backtest.page.scss'],
  standalone: false
})
export class BacktestPage implements OnInit {
   backtestResult: any = null;
  buyCompletedCycle: number = 0; // Add property to store the cycle count

  constructor(private backtestService: BacktestService) { }

  ngOnInit() {
  }

onFileChange(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      this.runBacktest(jsonData);
    };
    reader.readAsArrayBuffer(file);
  }

  runBacktest(data: any[]) {
    this.backtestResult = this.backtestService.runBacktest(data);
    this.buyCompletedCycle = this.backtestResult.buyCompletedCycle; // Store the cycle count
    console.log('Backtest Result:', this.backtestResult);
  }
}
