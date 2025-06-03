import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import ptFile from '../../src/assets/pt.json';
import engFile from '../../src/assets/eng.json';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  // Cria um BehaviorSubject para armazenar o idioma atual
  private languageSubject: BehaviorSubject<'pt' | 'eng'> = new BehaviorSubject<'pt' | 'eng'>(this.loadInitialLanguage());

  constructor() {}

  private loadInitialLanguage(): 'pt' | 'eng' {
    const savedLang = localStorage.getItem('lang');
    return savedLang === 'eng' ? 'eng' : 'pt';
  }

  // Método para alterar o idioma e emitir a nova linguagem
  setLanguage(lang: 'pt' | 'eng'): void {
    this.languageSubject.next(lang);
    localStorage.setItem('lang', lang);
  }

  // Permite que outros componentes se inscrevam para receber mudanças de idioma
  getLanguage$(): Observable<'pt' | 'eng'> {
    return this.languageSubject.asObservable();
  }

  // Método para obter o arquivo de labels baseado no idioma atual
  getFile(): any {
    const lang = this.languageSubject.getValue();
    return lang === 'pt' ? ptFile.PT : engFile.ENG;
  }
}
