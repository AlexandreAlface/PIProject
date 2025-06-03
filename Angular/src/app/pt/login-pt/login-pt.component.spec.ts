import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPtComponent } from './login-pt.component';

describe('LoginPtComponent', () => {
  let component: LoginPtComponent;
  let fixture: ComponentFixture<LoginPtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPtComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginPtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
