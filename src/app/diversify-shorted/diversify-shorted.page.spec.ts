import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiversifyShortedPage } from './diversify-shorted.page';

describe('DiversifyShortedPage', () => {
  let component: DiversifyShortedPage;
  let fixture: ComponentFixture<DiversifyShortedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DiversifyShortedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
