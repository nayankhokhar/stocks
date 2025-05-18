import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllStocksPage } from './all-stocks.page';

describe('AllStocksPage', () => {
  let component: AllStocksPage;
  let fixture: ComponentFixture<AllStocksPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AllStocksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
