import { Component, OnDestroy, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import {finalize, forkJoin, Subject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ArticleService } from '../../../services/article.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { DashboardData } from '../../../models/models';
import { DEPARTMENTS } from '../../../constants/departments';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageService } from '../../../services/Language.Service'; // Importar lista de departamentos

@Component({
  selector: 'app-dash-board-pt',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, AsyncPipe, ReactiveFormsModule],
  providers: [ArticleService],
  templateUrl: './dash-board-pt.component.html',
  styleUrls: ['./dash-board-pt.component.css'],
})
export class DashBoardPTComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  chart: Chart | undefined;

  // Formulário de filtros
  filtersForm!: FormGroup;

  // Dados do Dashboard com os novos campos
  dashboardData: DashboardData = {
    totalArticles: 0,
    revistaCount: 0,
    capituloCount: 0,
    conferenciaCount: 0,
    outroCount: 0,
    percentages: {
      revista: '0%',
      capitulo: '0%',
      conferencia: '0%',
      outro: '0%',
    },
  };

  // Labels para o template
  dashboardLabels: any;

  // Lista de departamentos e ciclos de estudo
  departAllList = DEPARTMENTS;
  ciclosEstudosList: { id: string; nome: string }[] = [];

  isAuthenticated = !!localStorage.getItem('login');

  isLoading: boolean = false;

  constructor(
    private articleService: ArticleService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dashboardLabels = this.languageService.getFile();
        if (this.chart) {
          this.updateChart();
        }
      });

    // Carrega os ciclos de estudo
    this.loadCicloEstudos();

    // Inicializa o formulário
    this.initForm();

    // Carrega os dados do Dashboard
    this.loadDashboardData();

    // Atualiza os dados ao alterar os filtros dinamicamente
    this.filtersForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
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
   * Inicializa o formulário de filtros
   */
  initForm(): void {
    this.filtersForm = this.fb.group({
      departamento: ['Todos'],
      cicloEstudo: ['Todos'],
      dbValue: ['Ambos'],
      dataStart: ['1990-01-01'],
      dataEnd: [new Date().toISOString().split('T')[0]],
    });
  }

  /**
   * Carrega os dados do Dashboard com base nos filtros
   */
  loadDashboardData(): void {
    const filters = this.filtersForm.value;

    this.articleService
      .getArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe((articles) => {
        // Filtrar os artigos com base nos filtros aplicados

        const filteredArticles = this.articleService.filterArticlesDashboard(articles, filters);

        // Calcular os dados do dashboard com os artigos filtrados
        // Agora usando a nova lógica que considera os tipos:
        // "Artigos em revista", "Capítulo em livro", "Artigos em conferência" e "Outro"
        this.dashboardData = this.articleService.calculateDashboardData(filteredArticles, filters);

        // Atualizar o gráfico com os novos dados
        this.updateChart();
      });
  }

  /**
   * Limpa os filtros e recarrega os dados do Dashboard
   */
  resetFilters(): void {
    this.filtersForm.reset({
      departamento: 'Todos',
      cicloEstudo: 'Todos',
      dbValue: 'Ambos',
      dataStart: '1990-01-01',
      dataEnd: new Date().toISOString().split('T')[0],
    });

    this.loadDashboardData(); // Recarrega os dados com os filtros padrão
  }


  /**
   * Atualiza o gráfico com os dados do Dashboard
   */
  updateChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    // Usando os novos labels e dados do dashboard
    this.chart = new Chart('MyChart', {
      type: 'pie',
      data: {
        labels: [
          this.dashboardLabels.dashboard.Revista || 'Artigos em revista',
          this.dashboardLabels.dashboard.Capitulo || 'Capítulo em livro',
          this.dashboardLabels.dashboard.Conferencia || 'Artigos em conferência',
          this.dashboardLabels.dashboard.Outro || 'Outro'
        ],
        datasets: [
          {
            data: [
              this.dashboardData.revistaCount,
              this.dashboardData.capituloCount,
              this.dashboardData.conferenciaCount,
              this.dashboardData.outroCount,
            ],
            backgroundColor: ['Orange', 'Blue', 'Green', 'Red'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Desativa as legendas
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                // Mapeamento para os novos tipos
                const labelMap: Record<string, keyof typeof this.dashboardData.percentages> = {
                  'Artigos em revista': 'revista',
                  'Capítulo em livro': 'capitulo',
                  'Artigos em conferência': 'conferencia',
                  'Outro': 'outro'
                };

                // Pode usar o label vindo da tradução ou o default
                const label =
                  tooltipItem.label ||
                  (tooltipItem.label === '' ? 'Outro' : tooltipItem.label);
                const key = labelMap[label];
                const percentage = key ? this.dashboardData.percentages[key] : '0%';
                const value = tooltipItem.raw;

                return `${label}: ${value} (${percentage})`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Atualiza os artigos e recarrega o Dashboard
   */
  updateArticles() {

    this.isLoading = true;

    const requests = [
      this.articleService.addScopusArtigos(),
      this.articleService.addWBSArtigos(),
      this.articleService.addUnificarArtigos(),
    ];

    forkJoin(requests)
      .pipe(
        finalize(() => {
          // Ao finalizar (sucesso ou erro), desativa o loading
          this.isLoading = false;
          this.loadDashboardData(); // Recarrega os dados do dashboard
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          // Caso precise, faça algo ao completar com sucesso
        },
        error: (error) => {
          console.error('Erro durante as requisições:', error);
        },
      });
  }

  /**
   * Imprime a página
   */
  printPage(): void {
    window.print();
  }
}
