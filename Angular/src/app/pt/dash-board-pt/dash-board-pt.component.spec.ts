import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashBoardPTComponent } from './dash-board-pt.component';

describe('DashBoardPTComponent', () => {
  let component: DashBoardPTComponent;
  let fixture: ComponentFixture<DashBoardPTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashBoardPTComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashBoardPTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
