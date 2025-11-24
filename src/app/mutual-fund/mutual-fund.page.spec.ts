import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MutualFundPage } from './mutual-fund.page';

describe('MutualFundPage', () => {
  let component: MutualFundPage;
  let fixture: ComponentFixture<MutualFundPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MutualFundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
