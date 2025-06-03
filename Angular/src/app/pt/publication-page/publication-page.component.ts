import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { LanguageService } from '../../../services/Language.Service';
import {Article, Publication} from '../../../models/models';
import {Observable, Subject, window} from 'rxjs';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {MatTooltipModule} from "@angular/material/tooltip";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-publication-page',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './publication-page.component.html',
  styleUrl: './publication-page.component.css',
  providers: [ArticleService],
})
export class PublicationPageComponent implements OnInit, OnDestroy{
  filtersForm: FormGroup;
  publication?: Observable<Article | null>;
  labels: any;
  isAuthenticated = !!localStorage.getItem('login');
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private languageService: LanguageService
  ) {
    this.filtersForm = this.fb.group({
      startYear: ['1990'],
      endYear: [new Date().getFullYear().toString()],
    });
  }

  ngOnInit(): void {

    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });

    // Observa as alterações no ID da rota e carrega o artigo correspondente
    this.publication = this.route.paramMap.pipe(
      map((params) => params.get('id') || ''),
      switchMap((id) =>
        this.articleService.getArticles().pipe(
          map((articles) => articles.find((article) => article.id === id) || null)
        )
      )
    );
  }

  back(): void {
    this.router.navigateByUrl('/Publicações');
  }

  printPage(): void {
    // @ts-ignore
    window.print();
  }

  editPublication(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigateByUrl(`/${this.labels.nav.Publications}/${this.labels.publications.Edit}/${encodeURIComponent(id)}`);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
