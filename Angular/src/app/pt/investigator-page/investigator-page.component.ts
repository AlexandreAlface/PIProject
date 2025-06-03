import {Component, OnDestroy, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../../services/Language.Service';
import { ArticleService } from '../../../services/article.service';
import { Ivestigator, Article } from '../../../models/models';
import {Observable, of, Subject, window} from 'rxjs';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-investigator-page',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './investigator-page.component.html',
  styleUrls: ['./investigator-page.component.css'],
  providers: [ArticleService],
})
export class InvestigatorPageComponent implements OnInit, OnDestroy {
  investigator: Observable<Ivestigator | null> = of(null);
  publicationsByYear: Observable<Map<string, Article[]>> = of(new Map());
  labels: any;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private _router: Router,
    private languageService: LanguageService,
    private articleService: ArticleService
  ) {
    this.labels = this.languageService.getFile();
  }

  ngOnInit(): void {
    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });

    // Carrega os dados do investigador pela rota
    this.investigator = this.route.paramMap.pipe(
      map((params) => params.get('nome') || ''),
      switchMap((nome) =>
        this.articleService.getIvestigadores().pipe(
          map((investigators) =>
            investigators.find((investigator) => investigator.nome === nome) || null
          )
        )
      )
    );

    this.publicationsByYear = this.investigator.pipe(
      switchMap((investigator) =>
        investigator && investigator.orcid
          ? this.getRelatedPublications(investigator.orcid)
          : of([])
      ),
      map((articles) => this.organizePublications(articles))
    );
  }

  getRelatedPublications(authorOrcid: string): Observable<Article[]> {
    if (authorOrcid === "N/A") {
      return of([]);
    }

    return this.articleService.getArticles().pipe(
      map((articles) =>
        articles.filter((article) => {
          if (!article.orcids_autores) return false;
          const orcids = article.orcids_autores.split(';').map((orc) => orc.trim());
          return orcids.includes(authorOrcid);
        })
      )
    );
  }

  /**
   * Organiza as publicações por ano e ordena alfabeticamente dentro de cada ano.
   */
  private organizePublications(articles: Article[]): Map<string, Article[]> {
    const publicationsMap = new Map<string, Article[]>();

    articles.forEach((article) => {
      // Extrai apenas o ano da data_publicacao (exemplo: "2023-06-15" vira "2023")
      const year = article.data_publicacao ? article.data_publicacao.substring(0, 4) : 'Sem Ano';

      if (!publicationsMap.has(year)) {
        publicationsMap.set(year, []);
      }

      publicationsMap.get(year)?.push(article);
    });

    // Ordena alfabeticamente dentro de cada ano
    publicationsMap.forEach((articles, year) => {
      articles.sort((a, b) => a.titulo.localeCompare(b.titulo));
    });

    // Ordena os anos do mais recente para o mais antigo
    return new Map([...publicationsMap.entries()].sort((a, b) => Number(b[0]) - Number(a[0])));
  }

  back(): void {
    this._router.navigateByUrl(`/${this.labels.nav.Investigators}`);
  }

  navigateToPublication(id: string): void {
    if (!id) {
      console.error('ID inválido para navegação.');
      return;
    }
    this._router.navigateByUrl(`/Publicações/Ver/${encodeURIComponent(id)}`);
  }

  printPage(): void {
    // @ts-ignore
    window.print();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
