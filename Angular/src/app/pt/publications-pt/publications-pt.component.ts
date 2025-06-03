import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { LanguageService } from '../../../services/Language.Service';
import { Article, Publication } from '../../../models/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DEPARTMENTS } from '../../../constants/departments';
import { Router, RouterLink } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-publications-pt',
  standalone: true,
  templateUrl: './publications-pt.component.html',
  styleUrls: ['./publications-pt.component.css'],
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule, AsyncPipe, RouterLink, MatSelectModule],
  providers: [ArticleService],
})
export class PublicationsPTComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Formulário de filtros
  filtersForm!: FormGroup;

  // Dados de publicações filtradas
  publications: Publication[] = [];

  pagination = {
    page: 0,
    size: 25, // Número de itens por página
    total: 0, // Total de itens
  };

  // Labels para o template
  labels: any;

  // Lista de departamentos e ciclos de estudo
  departAllList = DEPARTMENTS;
  ciclosEstudosList: { id: string; nome: string }[] = [];

  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private languageService: LanguageService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });

    // Carrega ciclos de estudo e inicializa o formulário
    this.loadCicloEstudos();
    this.initForm();

    // Carrega publicações e configura filtros dinâmicos
    this.loadPublications();
  }

  ngAfterViewInit(): void {
    this.filtersForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa o formulário de filtros com os novos controles para tipos
   */
  initForm(): void {
    this.filtersForm = this.fb.group({
      title: [''], // Campo de título
      investigator: [''], // Campo de investigador
      orcid: [''],

      // Agora usamos os novos controles para os tipos:
      revista: [true],       // Artigos em revista
      capitulo: [true],      // Capítulo em livro
      conferencia: [true],   // Artigos em conferência
      outro: [true],         // Outros
      department: ['Todos'], // Seleciona todos por padrão
      database: ['Ambos'],   // Seleciona ambos por padrão
      area: ['Todos'],       // Seleciona todos por padrão
      startDate: [new Date('1990-01-01').toISOString().split('T')[0]], // Data inicial
      endDate: [new Date().toISOString().split('T')[0]],               // Data final
      sort: ['date']
    });
  }

  getActiveFilters(): string {
    const filters = this.filtersForm.value;
    const activeFilters: string[] = [];

    // Verifica cada filtro e, se ativo, adiciona com o rótulo em negrito
    if (filters.title && filters.title.trim() !== '') {
      activeFilters.push(`<strong>${this.labels.filters.Title}:</strong> ${filters.title}`);
    }
    if (filters.investigator && filters.investigator.trim() !== '') {
      activeFilters.push(`<strong>${this.labels.filters.Investigator}:</strong> ${filters.investigator}`);
    }
    if (filters.orcid && filters.orcid.trim() !== '') {
      activeFilters.push(`<strong>${this.labels.filters.Orcid}:</strong> ${filters.orcid}`);
    }
    if (filters.department && filters.department !== 'Todos') {
      activeFilters.push(`<strong>${this.labels.filters.Department}:</strong> ${filters.department}`);
    }
    if (filters.database && filters.database !== 'Ambos') {
      activeFilters.push(`<strong>${this.labels.filters.Database}:</strong> ${filters.database}`);
    }
    if (filters.area && filters.area !== 'Todos') {
      activeFilters.push(`<strong>${this.labels.filters.Area}:</strong> ${filters.area}`);
    }
    if (filters.startDate && filters.startDate !== '1990-01-01') {
      activeFilters.push(`<strong>${this.labels.filters.DataStart}:</strong> ${filters.startDate}`);
    }
    const today = new Date().toISOString().split('T')[0];
    if (filters.endDate && filters.endDate !== today) {
      activeFilters.push(`<strong>${this.labels.filters.DataEnd}:</strong> ${filters.endDate}`);
    }

    return activeFilters.join(', ');
  }


  /**
   * Carrega a lista de ciclos de estudo
   */
  loadCicloEstudos(): void {
    this.articleService
      .getCursosCnaefs()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.ciclosEstudosList = data;
      });
  }

  /**
   * Carrega e aplica filtros às publicações
   */
  loadPublications(): void {
    this.isLoading = true;

    this.articleService
      .getArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe((articles) => {
        const filters = this.filtersForm.value;

        // Filtra os artigos com base nos filtros aplicados
        let filteredArticles = this.articleService.filterArticlesPublication(articles, filters);

        filteredArticles = this.sortArticles(filteredArticles, filters.sort);

        // Atualiza as publicações filtradas
        this.publications = filteredArticles.map((article) => ({
          artigo: article,
          paginas: article.paginas || 'Não disponível',
        }));

        // Atualiza o total de publicações e aplica paginação
        this.pagination.total = this.publications.length;
        this.publications = this.paginatePublications(this.publications);

        this.isLoading = false;
      });
  }

  sortArticles(articles: Article[], sortOrder: string): Article[] {
    switch (sortOrder) {
      case 'dateR':
        return articles.sort(
          (a, b) =>
            new Date(a.data_publicacao).getTime() - new Date(b.data_publicacao).getTime()
        );
      case 'date':
        return articles.sort(
          (a, b) =>
            new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime()
        );
      case 'name':
        return articles.sort((a, b) => a.titulo.localeCompare(b.titulo));
      case 'nameR':
        return articles.sort((a, b) => b.titulo.localeCompare(a.titulo));
      case 'type':
        return articles.sort((a, b) => a.tipo.localeCompare(b.tipo));
      case 'typeR':
        return articles.sort((a, b) => b.tipo.localeCompare(a.tipo));
      default:
        return articles;
    }
  }

  changePage(delta: number): void {
    const newPage = this.pagination.page + delta;

    if (newPage >= 0 && newPage < Math.ceil(this.pagination.total / this.pagination.size)) {
      this.pagination.page = newPage;
      this.applyFilters();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pagination.size = newSize;
    this.pagination.page = 0;
    this.applyFilters();
  }

  applyFilters(): void {
    this.loadPublications();
  }

  /**
   * Reseta os filtros para os valores padrão
   */
  resetFilters(): void {
    this.filtersForm.reset({
      title: '',
      investigator: '',
      orcid: '',
      revista: true,
      capitulo: true,
      conferencia: true,
      outro: true,
      department: 'Todos',
      database: 'Ambos',
      area: 'Todos',
      startDate: new Date('1990-01-01').toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      sort: 'date'
    });

    this.loadPublications(); // Recarrega os artigos sem filtro aplicado
  }


  navigateToPublication(id: string): void {
    if (!id) {
      console.error('ID inválido para navegação.');
      return;
    }
    this._router.navigateByUrl(`/Publicações/Ver/${encodeURIComponent(id)}`);
  }

  /**
   * Divide os resultados em páginas
   */
  paginatePublications(publications: Publication[]): Publication[] {
    const { page, size } = this.pagination;

    if (size === -1) {
      return publications;
    }

    return publications.slice(page * size, (page + 1) * size);
  }

  protected readonly Math = Math;
}
