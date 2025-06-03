import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClientModule } from '@angular/common/http';
import {LanguageService} from "../services/Language.Service";
import { Subject } from 'rxjs';
import {takeUntil} from "rxjs/operators";
import {AuthService} from "../services/auth.service";

export interface Lang {
  value: string;
  str: string;
  img: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatFormFieldModule, MatSelectModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Projeto Integrado';
  autenticado = !!localStorage.getItem('login');
  token = localStorage.getItem('token');
  selected: string;
  file: any;
  navItems: { [key: string]: string } = {};
  activePage: string = 'D'; // Página ativa inicial (exemplo: 'D'
  private destroy$ = new Subject<void>();

  langs: Lang[] = [
    { value: 'pt', str: 'PT', img: './assets/pt-flag.png', isDefault: true },
    { value: 'eng', str: 'EN', img: './assets/eng-flag.png', isDefault: false },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private languageService: LanguageService, private authService: AuthService) {
    this.selected = this.languageService.getFile() ? 'pt' : 'eng';
    this.loadLanguageFile();
  }


  ngOnInit(): void {
    // Inscreva-se para atualizar as labels sempre que o idioma mudar
    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.file = this.languageService.getFile();
        this.navItems = {
          D: this.file.nav.Start,
          P: this.file.nav.Publications,
          I: this.file.nav.Investigators,
          A: this.file.nav.Admin,
          L: this.file.nav.Login,
          O: this.file.nav.Logout,
        };
      });

    this.authService.getLoggedIn()
      .pipe(takeUntil(this.destroy$))
      .subscribe((loggedIn: boolean) => {
        this.autenticado = loggedIn;
      });

    this.updateActiveRoute();
  }

  private loadLanguageFile(): void {
    this.file = this.languageService.getFile();
    this.navItems = {
      D: this.file.nav.Start,
      P: this.file.nav.Publications,
      I: this.file.nav.Investigators,
      A: this.file.nav.Admin,
      L: this.file.nav.Login,
      O: this.file.nav.Logout,
    };
  }

  moveRoute(page: string): void {
    this.activePage = page; // Atualiza a página ativa
  }

  private updateActiveRoute(): void {
    const routeParams = window.location.href;
    const mappings: { [key: string]: string } = {
      Start: 'D',
      Início: 'D',
      Publi: 'P',
      Admin: 'A',
      Invest: 'I',
      Login: 'L',
      Entrar: 'L',
      Logout: 'O',
      Sair: 'O',
    };

    Object.keys(mappings).forEach((key) => {
      if (routeParams.includes(key)) {
        this.activePage = mappings[key];
      }
    });
  }

  updateLanguage(): void {
    // Define o novo idioma no servico
    this.languageService.setLanguage(this.selected as 'pt' | 'eng');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
