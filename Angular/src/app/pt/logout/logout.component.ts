// src/app/components/logout/logout.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {LanguageService} from "../../../services/Language.Service";
import {AuthService} from "../../../services/auth.service";


@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  providers: [LanguageService],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {
  labels: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem("login")) {
      this.router.navigateByUrl("/");
    }
    // Obtém os rótulos a partir do LanguageService
    this.labels = this.languageService.getFile();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem("login");
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        this.authService.setLoggedIn(false);
        this.router.navigateByUrl("/");
      },
      error: (error: any) => {
        console.error('Erro ao efetuar logout:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl("/");
  }
}
