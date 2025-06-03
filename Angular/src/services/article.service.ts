import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable, skip} from 'rxjs';
import { environment } from '../environments/environments';
import {Article, Curso, DashboardData, Ivestigator} from '../models/models';
import {
  AREA_CODE_MAPPING,
  CNAEF_BY_DEPARTMENT,
  DEPARTMENT_NAME_MAPPING,
  departmentMapping,
  DEPARTMENTS
} from "../constants/departments";

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Supondo que o backend retorne um array de objetos onde a primeira linha é o header
  getArticles(): Observable<Article[]> {
    return this.http.get<any[]>(`${this.apiUrl}/artigos`).pipe(
      map((data: any[]) => {

        return data.map(item => ({
          id: item.id,
          titulo: item.titulo,
          // Usamos o autor_principal; se não existir, fallback para autores_artigo
          autores_artigo: item.autores_artigo,
          autor_principal: item.autor_principal,
          fonte: item.fonte,
          doi: item.doi,
          issn: item.issn,
          isbn: this.formatISBN(item.isbn),
          volume: item.volume && item.volume !== 'undefined' ? item.volume : 'Não disponível',
          // Se o campo 'numero' for importante, descomente ou adicione:
          // numero: item.numero,
          paginas: item.paginas,
          editor: item.editor,
          // Extraímos o ano a partir do data_publicacao (supondo o formato "YYYY-MM-DD")
          data_publicacao: item.data_publicacao,
          descricao: item.descricao,
          // Se keywords estiver vazio, usamos palavras_chave
          palavras_chave: item.palavras_chave,
          citacoes: item.citacoes !== 'N/A' ? item.citacoes : 'Não disponível',
          // Se existir um campo de contagem de citações, você pode adicioná-lo:
          citedByCount: item.cited_by_count,
          tipo: item.tipo || 'Não especificado',
          articleNumber: item.article_number,
          departamento: item.departamento,
          origem: item.origem || 'Não especificado',
          financiador: item.financiador ?? '',
          repositorioIPBeja: item.repositorioIPBeja ?? '',
          apoiosPublicacao: item.apoiosPublicacao ?? '',
          orcids_autores: item.orcid_autores,
          organizacoes: item.organizacoes !== 'N/A' ? item.organizacoes : 'Não disponível',
          afiliacoes: item.afiliacoes ?? ''
        }));
      })
    );
  }

  getIvestigadores(): Observable<Ivestigator[]> {
    return this.http.get<Ivestigator[]>(`${this.apiUrl}/Autores`).pipe(
      map((data: any[]) => {
        return data.map((item: any, index: number) => {
          // Obter o nome do departamento usando o mapeamento de departamentos
          const departmentName =
            DEPARTMENT_NAME_MAPPING[this.normalizeDepartment(item[3])] || 'N/A';

          // Extrair os códigos CNAEF originais (das posições 4, 5 e 6), removendo valores vazios e "N/A"
          const uniqueCnaefRawCodes = [
            ...new Set([item[4], item[5], item[6]].filter((code) => code && code !== "N/A"))
          ];

          // Obter os nomes das áreas a partir dos códigos, aplicando a normalização
          const uniqueCnaefNames = uniqueCnaefRawCodes.map((code) => this.normalizeArea(code));
          const uniqueAreasString = uniqueCnaefNames.join(', ');

          return {
            id: index + 1, // Incrementa o índice para começar do 1
            nome: item[0] ?? 'N/A', // Nome na posição 0
            orcid: item[2],         // ORCID na posição 2
            departamento: departmentName, // Nome do departamento
            cnaef: uniqueAreasString,       // Áreas CNAEF normalizadas (nomes)
            cnaefCodes: uniqueCnaefRawCodes.join(', ') // Códigos CNAEF originais (se preferir, pode ser um array)
          };
        });
      })
    );
  }

  private formatISBN(isbn: any): string {
    if (Array.isArray(isbn)) {
      return isbn.join(', ');
    } else {
      return isbn === 'true' ? 'Informação de ISBN não disponível' : isbn;
    }
  }

  getCicloEstudos(): Observable<{ id: string; nome: string }[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cnaef`).pipe(
      map((data) => {
        return data.map((item: any[]) => ({
          id: item[0], // Primeiro elemento do array é o ID
          nome: item[1], // Segundo elemento do array é o nome
        }));
      })
    );
  }

  /**
   * Faz a requisição ao endpoint de cursos, extrai os CNAEFs de cada curso,
   * remove duplicatas e retorna um array de objetos no formato:
   * { id: string; nome: string }.
   *
   * O 'id' é o código do CNAEF e o 'nome' é obtido a partir do mapeamento definido.
   */
  getCursosCnaefs(): Observable<{ id: string; nome: string }[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/Cursos`).pipe(
      map((cursos: Curso[]) => {
        // Utiliza um Set para garantir que os códigos CNAEF não se repitam
        const cnaefsSet = new Set<string>();

        cursos.forEach((curso) => {
          if (curso.cnaefs && Array.isArray(curso.cnaefs)) {
            curso.cnaefs.forEach((cnaef: string) => {
              if (cnaef.trim() !== '') {
                cnaefsSet.add(cnaef.trim());
              }
            });
          }
        });

        // Converte o Set para Array, ordena os ids numericamente e mapeia para o formato desejado
        return Array.from(cnaefsSet)
          .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
          .map((cnaefCode) => ({
            id: cnaefCode,
            nome: AREA_CODE_MAPPING[cnaefCode] || cnaefCode
          }));
      })
    );
  }

  addUnificarArtigos(): Observable<any> {
    const url = `${this.apiUrl}/artigos/add/Unificar`;
    const headers = this.getAuthHeaders();
    return this.http.post(url, [1], { headers });
  }

  addScopusArtigos(): Observable<any> {
    const url = `${this.apiUrl}/artigos/add/Scopus`;
    const headers = this.getAuthHeaders();
    return this.http.post(url, [1], { headers });
  }

  addWBSArtigos(): Observable<any> {
    const url = `${this.apiUrl}/artigos/add/WBS`;
    const headers = this.getAuthHeaders();
    return this.http.post(url, [1], { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  calculateDashboardData(articles: Article[], filters: any): DashboardData {
    // Filtra os artigos que não devem ser considerados (tipo 'Ignorar')
    const validArticles = articles.filter(article => article.tipo !== 'Ignorar');
    const totalArticles = validArticles.length;

    // Contagem para cada tipo normalizado
    const revistaCount = validArticles.filter(article => article.tipo === 'Artigos em revista').length;
    const capituloCount = validArticles.filter(article => article.tipo === 'Capítulo em livro').length;
    const conferenciaCount = validArticles.filter(article => article.tipo === 'Artigos em conferência').length;
    const outroCount = validArticles.filter(article => article.tipo === 'Outro').length;

    // Cálculo das porcentagens
    const percentages = {
      revista: totalArticles ? ((revistaCount / totalArticles) * 100).toFixed(2) + '%' : '0%',
      capitulo: totalArticles ? ((capituloCount / totalArticles) * 100).toFixed(2) + '%' : '0%',
      conferencia: totalArticles ? ((conferenciaCount / totalArticles) * 100).toFixed(2) + '%' : '0%',
      outro: totalArticles ? ((outroCount / totalArticles) * 100).toFixed(2) + '%' : '0%',
    };

    return {
      totalArticles,
      revistaCount,
      capituloCount,
      conferenciaCount,
      outroCount,
      percentages,
    };
  }

  filterArticlesPublication(articles: Article[], filters: any): Article[] {
    const {
      area,
      revista,
      capitulo,
      conferencia,
      outro,
      database,
      department,
      endDate,
      investigator,
      orcid,
      startDate,
      title
    } = filters;

    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();

    const isTitleActive = title?.trim() !== '';
    const isInvestigatorActive = investigator?.trim() !== '';
    // Considera o filtro de tipos ativo se algum dos checkboxes estiver marcado
    const isTypeActive = revista || capitulo || conferencia || outro;
    const isDepartmentActive = department && department !== 'Todos';
    const isCicloEstudoActive = area && area !== 'Todos';
    const isDbValueActive = database && database !== 'Ambos';
    // Novo filtro para ORCID
    const isOrcidActive = orcid?.trim() !== '';

    return articles.filter((article) => {
      // Extraímos o ano da data_publicacao (supondo o formato "YYYY-MM-DD")
      const publicationYear = parseInt(article.data_publicacao);
      const normalizedDepartment = this.normalizeDepartment(article.departamento);
      const validCnaefs = this.normalizeCnaef(article.departamento);

      const matchTitle = isTitleActive
        ? article.titulo.toLowerCase().includes(title.toLowerCase())
        : true;

      const matchInvestigator = isInvestigatorActive
        ? article.autores_artigo.toLowerCase().includes(investigator.toLowerCase())
        : true;

      // Verifica se o artigo corresponde ao tipo selecionado
      const matchType = !isTypeActive ||
        (
          (revista && article.tipo === 'Artigos em revista') ||
          (capitulo && article.tipo === 'Capítulo em livro') ||
          (conferencia && article.tipo === 'Artigos em conferência') ||
          (outro && article.tipo === 'Outro')
        );

      const matchDepartment = !isDepartmentActive || normalizedDepartment === department;
      const matchCicloEstudo = !isCicloEstudoActive || validCnaefs.includes(area);
      const matchDbValue = !isDbValueActive ||
        (database === 'Scopus' && (article.origem === 'Scopus' || article.origem === 'WBS/Scopus')) ||
        (database === 'WBS' && (article.origem === 'WBS' || article.origem === 'WBS/Scopus'));
      const matchDateRange = publicationYear >= startYear && publicationYear <= endYear;

      // Lógica para filtrar por ORCID:
      // Se o filtro de ORCID estiver ativo, converte a string de ORCIDs do artigo em um array,
      // removendo espaços em branco, e verifica se algum dos ORCIDs contém o valor informado no filtro.
      const matchOrcid = isOrcidActive
        ? article.orcids_autores
          .split(';')
          .map((orc: string) => orc.trim())
          .some((orc: string | any[]) => orc.includes(orcid))
        : true;

      return matchTitle && matchInvestigator && matchType &&
        matchDepartment && matchCicloEstudo && matchDbValue && matchDateRange && matchOrcid;
    });
  }

  filterArticlesDashboard(articles: Article[], filters: any): Article[] {
    const { departamento, cicloEstudo, dbValue, dataStart, dataEnd } = filters;

    // Extrai os anos a partir das datas informadas
    const startYear = new Date(dataStart).getFullYear();
    const endYear = new Date(dataEnd).getFullYear();

    // Verifica se os filtros de departamento, área e banco de dados estão ativos
    const isDepartmentActive = departamento && departamento !== 'Todos';
    const isCicloEstudoActive = cicloEstudo && cicloEstudo !== 'Todos';
    const isDbValueActive = dbValue && dbValue !== 'Ambos';

    return articles.filter((article) => {
      // Extrai o ano de publicação (supondo o formato "YYYY-MM-DD")
      const publicationYear = parseInt(article.data_publicacao);
      const normalizedDepartment = this.normalizeDepartment(article.departamento);
      const validCnaefs = this.normalizeCnaef(article.departamento);

      // Verifica se o departamento do artigo corresponde ao filtro
      const matchDepartment = !isDepartmentActive || normalizedDepartment === departamento;

      // Verifica se a área (ou ciclo de estudo) do artigo está entre as CNAEFs válidas
      const matchCicloEstudo = !isCicloEstudoActive || validCnaefs.includes(cicloEstudo);

      // Verifica se o artigo corresponde ao filtro de banco de dados
      const matchDbValue = !isDbValueActive ||
        (dbValue === 'Scopus' && (article.origem === 'Scopus' || article.origem === 'WBS/Scopus')) ||
        (dbValue === 'WBS' && (article.origem === 'WBS' || article.origem === 'WBS/Scopus'));

      // Verifica se o ano de publicação do artigo está dentro do intervalo definido
      const matchDateRange = publicationYear >= startYear && publicationYear <= endYear;

      return matchDepartment && matchCicloEstudo && matchDbValue && matchDateRange;
    });
  }

  filterIvestigadores(ivestigadores: any[], filters: any): Ivestigator[] {
    const { department, area, orcid, investigator: nome } = filters;

    return ivestigadores.filter((ivestigadore) => {
      // 1. Filtrar por departamento (usando o acrônimo)
      const normalizedDepartment = this.getDepartmentAcronym(ivestigadore.departamento);
      const matchDepartamento =
        !department || department === 'Todos' || normalizedDepartment === department;

      // 2. Filtrar pela área CANEF usando o campo `cnaefCodes`
      let matchArea = false;
      if (!area || area === 'Todos') {
        matchArea = true;
      } else if (ivestigadore.cnaefCodes) {
        // Supondo que cnaefCodes seja uma string com os códigos separados por vírgula
        const investigatorCodes = ivestigadore.cnaefCodes
          .split(',')
          .map((code: string) => code.trim())
          .filter((code: any) => code); // remove entradas vazias

        // Normalizamos o valor do filtro (caso haja formatações ou espaços indesejados)
        const normalizedFilterArea = this.normalizeArea(area);

        // Verifica se algum dos códigos do investigador corresponde (após normalização) ao código filtrado
        matchArea = investigatorCodes.some(
          (code: string | undefined) => this.normalizeArea(code) === normalizedFilterArea
        );
      }

      // 3. Filtro por ORCID (ignora caso não tenha sido informado)
      const matchOrcid =
        !orcid ||
        (ivestigadore.orcid &&
          ivestigadore.orcid.toLowerCase().includes(orcid.toLowerCase()));

      // 4. Filtro por nome do investigador (ignora caso não tenha sido informado)
      const matchNome =
        !nome ||
        (ivestigadore.nome &&
          ivestigadore.nome.toLowerCase().includes(nome.toLowerCase()));

      // Retorna o investigador se ele atender a todos os filtros aplicados.
      return matchDepartamento && matchArea && matchOrcid && matchNome;
    });
  }

  /**
   * Retorna o acrônimo do departamento com base no nome fornecido.
   * @param name - O nome do departamento a ser pesquisado.
   * @returns O acrônimo correspondente ou undefined se não encontrar.
   */
  private getDepartmentAcronym(name: string): string | undefined {
    const department = DEPARTMENTS.find(
      (dep) => dep.name.toLowerCase() === name.toLowerCase()
    );
    return department ? department.acronym : undefined;
  }


  private normalizeDepartment(department: string | undefined): string {
    if (department === undefined) {
      return "N/A"; // ou qualquer valor padrão que você queira usar para casos não definidos
    }
    return departmentMapping[department] || department;
  }

  private normalizeCnaef(department: string | undefined): string[] {
    if (department === undefined) {
      return ["N/A"]; // Retorna um array com "N/A" caso o departamento não seja definido
    }
    return CNAEF_BY_DEPARTMENT[department] || ["N/A"];
  }

  private normalizeArea(areaCode: string | undefined): string | string[] {
    if (areaCode === undefined) {
      return ["N/A"]; // Retorna um array com "N/A" caso o departamento não seja definido
    }
    return AREA_CODE_MAPPING[areaCode] || ["N/A"];
  }

  updateArticle(updatedArticle: Article): Observable<any> {
    const url = `${this.apiUrl}/artigos/add/parametros`;

    const headers = this.getAuthHeaders();

    return this.http.post<any>(url, updatedArticle, { headers, responseType: 'json' });
  }
}
