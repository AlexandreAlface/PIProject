import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';

import { catchError } from 'rxjs/operators';
import {environment} from "../environments/environments";

export interface LoginResponse {
  token: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // A URL da API definida no environment
  private loggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(!!localStorage.getItem('login'));

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const url = `${this.apiUrl}/login`;
    const body = { email, password };
    return this.http.post<LoginResponse>(url, body).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    const url = `${this.apiUrl}/logout`;
    const body = { id: localStorage.getItem('id') };
    return this.http.post<any>(url, body).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  getLoggedIn(): Observable<boolean> {
    return this.loggedInSubject.asObservable();
  }

  setLoggedIn(value: boolean): void {
    if (value) {
      localStorage.setItem('login', 'true');
    } else {
      localStorage.removeItem('login');
      localStorage.removeItem('token');
      localStorage.removeItem('id');
    }
    this.loggedInSubject.next(value);
  }

  // Método para retornar o estado atual
  isLoggedIn(): boolean {
    return this.loggedInSubject.getValue();
  }
}
