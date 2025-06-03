import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestigatorPageComponent } from './investigator-page.component';

describe('InvestigatorPageComponent', () => {
  let component: InvestigatorPageComponent;
  let fixture: ComponentFixture<InvestigatorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestigatorPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvestigatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
