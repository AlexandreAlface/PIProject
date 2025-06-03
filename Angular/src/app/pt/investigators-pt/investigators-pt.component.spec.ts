import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestigatorsPTComponent } from './investigators-pt.component';

describe('InvestigatorsPTComponent', () => {
  let component: InvestigatorsPTComponent;
  let fixture: ComponentFixture<InvestigatorsPTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestigatorsPTComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvestigatorsPTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
