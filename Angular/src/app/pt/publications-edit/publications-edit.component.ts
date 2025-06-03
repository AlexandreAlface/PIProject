
import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import ptFile from '../../../assets/pt.json'
import engFile from '../../../assets/eng.json'
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Article} from "../../../models/models";
import {ArticleService} from "../../../services/article.service";
import {LanguageService} from "../../../services/Language.Service";
import {take, takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";


@Component({
  selector: 'app-publications-edit',
  standalone: true,
  imports: [CommonModule, MatSelectModule, RouterLink, MatTooltipModule, ReactiveFormsModule],
  templateUrl: './publications-edit.component.html',
  styleUrl: './publications-edit.component.css',
  providers: [DatePipe, ArticleService],
})

export class PublicationsEditComponent implements OnInit, OnDestroy {

  editForm!: FormGroup;
  article?: Article;
  labels: any;
  autenticado = localStorage.getItem("login");
  formKeys: string[] = [];
  id: string | null = null;
  private destroy$ = new Subject<void>();


  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private route: ActivatedRoute,
    private router: Router,
    private languageService: LanguageService
  ) {  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });

    this.loadArticle(); // Carregar o artigo antes de inicializar o formulário
  }

  private loadArticle(): void {
    this.articleService.getArticles().subscribe(articles => {
      const article = articles.find(article => article.id === this.id );
      if (article) {
        this.article = article;
        this.initForm(article); // Inicialize o formulário aqui com os dados do artigo
      } else {
        console.error('Artigo não encontrado!');
        this.router.navigate(['/error']); // Opcional: redirecionar para uma página de erro
      }
    });
  }

  private initForm(article: Article): void {
    this.editForm = this.fb.group({
      // Campos que serão habilitados somente se estiverem vazios ou tiverem valor "N/A"
      titulo: [{ value: article.titulo || '', disabled: !this.isFieldEditable(article.titulo) }],
      autoresArtigo: [{ value: article.autores_artigo || '', disabled: !this.isFieldEditable(article.autores_artigo) }],
      fonte: [{ value: article.fonte || '', disabled: !this.isFieldEditable(article.fonte) }],
      doi: [{ value: article.doi || '', disabled: !this.isFieldEditable(article.doi) }],
      data_publicacao: [{ value: article.data_publicacao || '', disabled: !this.isFieldEditable(article.data_publicacao) }],
      descricao: [{ value: article.descricao || '', disabled: !this.isFieldEditable(article.descricao) }],
      citedByCount: [{ value: article.citedByCount || '', disabled: !this.isFieldEditable(article.citedByCount) }],
      tipo: [{ value: article.tipo || '', disabled: !this.isFieldEditable(article.tipo) }],
      articleNumber: [{ value: article.articleNumber || '', disabled: !this.isFieldEditable(article.articleNumber) }],
      departamento: [{ value: article.departamento || '', disabled: !this.isFieldEditable(article.departamento) }],
      origem: [{ value: article.origem || '', disabled: !this.isFieldEditable(article.origem) }],
      orcid_autores: [{ value: article.orcids_autores || '', disabled: !this.isFieldEditable(article.orcids_autores) }],
      afiliacoes: [{ value: article.afiliacoes || '', disabled: !this.isFieldEditable(article.afiliacoes) }],
      issn: [{ value: article.issn || '', disabled: !this.isFieldEditable(article.issn) }],
      isbn: [{ value: article.isbn || '', disabled: !this.isFieldEditable(article.isbn) }],
      editor: [{ value: article.editor || '', disabled: !this.isFieldEditable(article.editor) }],
      financiador: [{ value: article.financiador || '', disabled: !this.isFieldEditable(article.financiador) }],

      // Campos que devem estar sempre editáveis
      repositorioIPBeja: [{ value: article.repositorioIPBeja || '', disabled: false }],
      apoiosPublicacao: [{ value: article.apoiosPublicacao || '', disabled: false }]
    });
  }

  private enableEditableFields(article: Article): void {
    const alwaysEditableFields = ['repositorioIPBeja', 'apoiosPublicacao'];

    Object.keys(article).forEach(key => {
      const control = this.editForm.get(key);
      if (control) {
        // Verifica se o campo é um dos sempre habilitados
        if (alwaysEditableFields.includes(key)) {
          control.enable(); // Força a habilitação dos campos sempre habilitados
        }
        // Verifica se o campo deve ser habilitado com a lógica existente
        else { // @ts-ignore
          if (this.isFieldEditable(article[key])) {
                    control.enable();
                  }
        }
      }
    });
  }

  private isFieldEditable(value: any): boolean {
    // Permite edição se o valor for vazio, nulo, "undefined" ou "N/A"
    return value === '' || value === null || value === undefined || value === "undefined" || value === "N/A";
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const updatedArticle = { ...this.article, ...this.editForm.value };

      this.articleService.updateArticle(updatedArticle)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (this.id) {
              this.router.navigateByUrl(`/Publicações/Ver/${encodeURIComponent(this.id)}`);
            }
          },
          error: (error) => {
            console.error('Erro ao atualizar o artigo:', error);
          }
        });
    }
  }

  formatLabel(key: string): string {
    return key
      .replace(/_/g, ' ') // Substitui underscores por espaços
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Separa 'IPBeja' em 'IP Beja'
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Insere um espaço antes de letras maiúsculas seguindo minúsculas
      .replace(/\b([A-Z]+)\b/g, function(match) { // Mantém abreviações em maiúsculas
        return match.toUpperCase();
      })
      .replace(/^./, function(str) { return str.toUpperCase(); }) // Capitaliza a primeira letra da string
      .trim(); // Remove espaços extras que podem aparecer no início ou no fim da string
  }

  back(): void {
    if (!this.id) {
      console.error('ID inválido para navegação.');
      return;
    }
    this.router.navigateByUrl(`/Publicações/Ver/${encodeURIComponent(this.id)}`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
