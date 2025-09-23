import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsiderTradingPage } from './insider-trading.page';

describe('InsiderTradingPage', () => {
  let component: InsiderTradingPage;
  let fixture: ComponentFixture<InsiderTradingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InsiderTradingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
