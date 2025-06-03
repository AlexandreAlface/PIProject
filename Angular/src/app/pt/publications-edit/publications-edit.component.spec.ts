import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationsEditComponent } from './publications-edit.component';

describe('PublicationsEditComponent', () => {
  let component: PublicationsEditComponent;
  let fixture: ComponentFixture<PublicationsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicationsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
