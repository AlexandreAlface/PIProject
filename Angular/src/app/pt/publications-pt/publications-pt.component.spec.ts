import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationsPTComponent } from './publications-pt.component';

describe('PublicationsPTComponent', () => {
  let component: PublicationsPTComponent;
  let fixture: ComponentFixture<PublicationsPTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsPTComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicationsPTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
