import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {finalize, forkJoin, Subject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { LanguageService } from '../../../services/Language.Service';
import { CommonModule } from '@angular/common';
import ptFile from "../../../assets/pt.json";
import engFile from "../../../assets/eng.json";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ArticleService} from "../../../services/article.service";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule],
  providers: [AdminService, ArticleService],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})

export class AdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  filtersForm!: FormGroup;
  filesAreas: any[] = [];
  filesInvestigators: any[] = [];
  labels: any;
  lastUpdate: any;
  isLoading: boolean = false;

  // 🔹 Variável para armazenar a mensagem de erro
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private fb: FormBuilder,
    private languageService: LanguageService,
    private articleService: ArticleService,
  ) {

  }

  ngOnInit(): void {

    this.languageService.getLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.labels = this.languageService.getFile();
      });


    this.initForm();
    this.loadInitialData();

    // 🔹 Inscrever-se no Observable de erro
    this.adminService.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.errorMessage = error;
    });

    this.filtersForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.reloadData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filtersForm = this.fb.group({
      file: [null],
      fileType: ['investigators'], // Could be 'investigators' or 'areas'
    });
  }

  private loadInitialData(): void {
    this.adminService
      .getLastUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.lastUpdate = data));

    this.reloadData();
  }

  reloadData(): void {
    this.adminService
      .getFiles('investigators')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.filesInvestigators = data));

    this.adminService
      .getFiles(this.labels.admin.Areas)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.filesAreas = data));
  }

  uploadFile(event: Event, type: string): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      this.adminService.uploadFile(file, type)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.reloadData();
          },
          error: (error) => {
            console.error('Erro ao fazer download do arquivo:', error);
          },
        });
    }
  }

  downloadFile(fileName: string, type: string): void {
    this.adminService.downloadFile(fileName, type);
  }


  deleteFile(fileName: string, type: string): void {
    this.adminService.deleteFile(fileName, type).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.reloadData();
    });
  }

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
          this.loadInitialData(); // Recarrega os dados do dashboard
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

  downloadUnifiedTable(): void {
    this.adminService.getLatestUnifiedFile().subscribe({
      next: (blob) => {

        // Verificar o conteúdo do Blob como texto
        const reader = new FileReader();
        reader.onload = () => {
        };
        reader.readAsText(blob);

        // Proceder com o download
        const downloadLink = document.createElement('a');
        const urlBlob = window.URL.createObjectURL(blob);
        downloadLink.href = urlBlob;

        const filename = 'Artigos_Unificados_Mais_Recente.csv'; // Nome padrão
        downloadLink.download = filename;
        downloadLink.click();

        window.URL.revokeObjectURL(urlBlob);
      },
      error: (err) => {
        console.error('Erro ao exportar o arquivo unificado:', err);
      },
    });


  }

}
