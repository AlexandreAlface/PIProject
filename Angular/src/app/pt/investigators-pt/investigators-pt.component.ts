import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { LanguageService } from '../../../services/Language.Service';
import {Article, Ivestigator} from '../../../models/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import {DEPARTMENTS} from "../../../constants/departments";

@Component({
  selector: 'app-investigators-pt',
  standalone: true,
  templateUrl: './investigators-pt.component.html',
  styleUrls: ['./investigators-pt.component.css'],
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule, RouterLink, MatSelectModule],
  providers: [ArticleService],
})
export class InvestigatorsPTComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Formulário de filtros
  filtersForm!: FormGroup;

  // Dados dos investigadores filtrados
  investigators: Ivestigator[] = [];

  pagination = {
    page: 0,
    size: 25,
    total: 0,
  };

  // Labels para o template
  labels: any;

  departamentos = DEPARTMENTS;
  ciclosEstudosList: { id: string; nome: string }[] = [];

  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });


    this.loadCicloEstudos();

    // Inicializa o formulário
    this.initForm();

    this.loadInvestigators();
  }

  ngAfterViewInit(): void {
    // Observa mudanças no formulário para aplicar filtros
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Carrega os ciclos de estudo
   */
  loadCicloEstudos(): void {
    this.articleService
      .getCursosCnaefs()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.ciclosEstudosList = data; // Atualiza a lista com os valores retornados
      });
  }

  /**
   * Método que monta uma string HTML com os filtros ativos, com os títulos em negrito.
   */
  getActiveFilters(): string {
    const filters = this.filtersForm.value;
    const activeFilters: string[] = [];

    if (filters.investigator && filters.investigator.trim() !== '') {
      activeFilters.push(`<strong>${this.labels.filters.Investigator}:</strong> ${filters.investigator}`);
    }
    if (filters.orcid && filters.orcid.trim() !== '') {
      activeFilters.push(`<strong>${this.labels.filters.Orcid}:</strong> ${filters.orcid}`);
    }
    if (filters.department && filters.department !== 'Todos') {
      activeFilters.push(`<strong>${this.labels.filters.Department}:</strong> ${filters.department}`);
    }
    if (filters.area && filters.area !== 'Todos') {
      activeFilters.push(`<strong>${this.labels.filters.Area}:</strong> ${filters.area}`);
    }

    return activeFilters.join(', ');
  }

  initForm(): void {
    this.filtersForm = this.fb.group({
      investigator: [''],
      orcid: [''],
      department: ['Todos'],
      area: ['Todos'],
      sort: ['name'],
    });
  }

  loadInvestigators(): void {
    this.isLoading = true;
    this.articleService.getIvestigadores().pipe(takeUntil(this.destroy$)).subscribe((ivestigadores) => {
      const filters = this.filtersForm.value;
      let filtered = this.articleService.filterIvestigadores(ivestigadores, filters);
      filtered = this.sortIvestigatores(filtered, filters.sort);

      this.pagination.total = filtered.length;

      // Reseta para a página inicial se o total mudar
      if (this.pagination.page >= Math.ceil(this.pagination.total / this.pagination.size)) {
        this.pagination.page = 0;
      }

      this.investigators = this.paginate(filtered);
      this.isLoading = false;
    });
  }

  sortIvestigatores(ivestigadores: Ivestigator[], sortOrder: string): Ivestigator[] {
    switch (sortOrder) {
      case 'name':
        return ivestigadores.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'nameR':
        return ivestigadores.sort((a, b) => b.nome.localeCompare(a.nome));
      default:
        return ivestigadores; // default no sort
    }
  }

  applyFilters(): void {
    this.loadInvestigators();
  }

  paginate(ivestigadores: Ivestigator[]): Ivestigator[] {
    const { page, size } = this.pagination;

    if (size === -1) {
      // Retorna todos os investigadores se o tamanho for -1
      return ivestigadores;
    }

    // Retorna apenas os itens da página atual
    return ivestigadores.slice(page * size, (page + 1) * size);
  }

  changePage(delta: number): void {
    const { page, size, total } = this.pagination;

    if (size === -1) {
      // Caso todos estejam sendo exibidos, não permite navegação
      return;
    }

    const newPage = page + delta;
    if (newPage >= 0 && newPage < Math.ceil(total / size)) {
      this.pagination.page = newPage;
      this.loadInvestigators();
    }
  }

  resetFilters(): void {
    this.initForm();
    this.loadInvestigators();
  }

  navigateToInvestigator(nome: string): void {
    if (nome) {
      this.router.navigateByUrl(`/Investigadores/Ver/${encodeURIComponent(nome)}`);
    }
  }

  protected readonly Math = Math;
  protected readonly departAllList = DEPARTMENTS;
}
