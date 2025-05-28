import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BacktestPage } from './backtest.page';

describe('BacktestPage', () => {
  let component: BacktestPage;
  let fixture: ComponentFixture<BacktestPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BacktestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
