import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {catchError, forkJoin, map, Observable, throwError, BehaviorSubject} from 'rxjs';
import { environment } from '../environments/environments';
import { Article, DashboardData } from '../models/models';
import * as XLSX from 'xlsx';
import {takeUntil} from "rxjs/operators";


@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  // 🔹 Subject para emitir mensagens de erro
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable(); // Expor como Observable

  constructor(private http: HttpClient) {}

  // Método para emitir erro
  emitError(message: string): void {
    this.errorSubject.next(message);
  }

  // Método para limpar erro
  clearError(): void {
    this.errorSubject.next(null);
  }

  getLastUpdate(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/artigos/data`);
  }

  getFiles(type: string): Observable<any[]> {
    const endpoint = type === 'investigators' ? 'Autores/ficheiros' : 'Cursos/ficheiros';
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/${endpoint}`, { headers }).pipe(
      map(files =>
        files.map(file => ({
          name: file.name || file, // Certifique-se de que o backend retorna "name"
          date: file.date || this.extractDateFromFileName(file) // Extrai data do nome, se necessário
        }))
      )
    );
  }

  private extractDateFromFileName(fileName: string): string {
    const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})/); // Extrai data no formato "YYYY-MM-DD"
    return match ? `${match[3]}/${match[2]}/${match[1]}` : ''; // Retorna "DD/MM/YYYY"
  }

  uploadFile(file: File, type: string): Observable<any> {
    const endpoint = type === 'investigators' ? 'Autores/add' : 'Cursos/add';
    const headers = this.getAuthHeaders();
    const formData = new FormData();

    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = (e) => {
        formData.append('file', file);

        // 📌 Envia diretamente ao backend (sem conversões ou manipulações extras)
        this.http.post<any>(`${this.apiUrl}/${endpoint}`, formData, { headers })
            .pipe(
                catchError((error: HttpErrorResponse) => {
                  // 🔹 Emitir o erro quando houver falha
                  const errorMessage = error.error?.message || 'Erro ao importar o arquivo.';
                  this.emitError(errorMessage);
                  return throwError(() => new Error(errorMessage));
                })
            )
            .subscribe({
          next: response => {
            this.clearError(); // Limpar qualquer erro anterior
            observer.next(response);
            observer.complete();
          },
          error: err => {
            observer.error(err);
          },
        });
      };
      // 📌 Detecta se é CSV ou XLSX
      if (file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  }


  downloadFile(fileName: string, type: string): void {
    const endpoint = type === 'investigators' ? 'Autores/download' : 'Cursos/download';
    const url = `${this.apiUrl}/${endpoint}/${fileName}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadLink = document.createElement('a');
        const urlBlob = window.URL.createObjectURL(blob);
        downloadLink.href = urlBlob;
        downloadLink.download = fileName; // Nome do arquivo
        downloadLink.click();
        window.URL.revokeObjectURL(urlBlob); // Libera memória
      },
      error: (error) => {
        console.error('Erro ao fazer download do arquivo:', error);
      },
    });
  }

  deleteFile(fileName: string, type: string): Observable<any> {
    const endpoint = type === 'investigators' ? 'Autores/delete' : 'Cursos/delete';
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${endpoint}/${fileName}`, { headers });
  }

  updateArticlesScopus(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/artigos/add/Scopus`, {}, { headers });
  }

  updateArticlesWBS(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/artigos/add/WBS`, {}, { headers });
  }

  updateArticlesUnificar(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/artigos/add/Unificar`, {}, { headers });
  }


  getLatestUnifiedFile(): Observable<Blob> {
    const url = `${this.apiUrl}/artigos/unificados`; // Certifique-se de que a URL está correta
    const headers = this.getAuthHeaders();
    return this.http.get(url, { headers, responseType: 'blob' });
  }



  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token não encontrado!');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

}

