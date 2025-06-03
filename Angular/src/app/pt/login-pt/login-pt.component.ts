// src/app/components/login-pt/login-pt.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../../services/Language.Service';
import { CommonModule } from '@angular/common';
import {AuthService, LoginResponse} from "../../../services/auth.service";

@Component({
  selector: 'app-login-pt',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-pt.component.html',
  styleUrls: ['./login-pt.component.css']
})
export class LoginPtComponent implements OnInit {
  loginForm!: FormGroup;
  labels: any;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtém os labels via LanguageService
    this.labels = this.languageService.getFile();

    // Se já estiver autenticado, redireciona para a home
    if (localStorage.getItem('login')) {
      this.router.navigateByUrl('/');
    }

    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (data: LoginResponse) => {
        if (data.token) {
          localStorage.setItem('login', 'true');
          localStorage.setItem('token', data.token);
          this.authService.setLoggedIn(true);
          this.router.navigateByUrl('/');
        } else {
          this.errorMessage = 'Token não encontrado na resposta da API.';
        }
      },
      error: () => {
        this.errorMessage = this.labels.login.Wrong;
        this.loginForm.reset();
      }
    });
  }
}
