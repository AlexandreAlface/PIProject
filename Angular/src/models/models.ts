export interface DashboardLabels {
  department: string;
  database: string;
  all: string;
  both: string;
  dataStart: string;
  dataEnd: string;
  articles: string;
  books: string;
  bookseries: string;
  meeting: string;
  filters: string; // Adicionar filtros
  search: string; // Adicionar busca
  clear: string; // Adicionar limpar
  updateNow: string; // Adicionar atualização
  updateArticlesToolTip: string; // Adicionar tooltip para atualização
  print: string; // Adicionar impressão
  searchToolTip: string; // Adicionado
  clearToolTip: string; // Adicionado
  printToolTip: string; // Adicionado
}

export interface Article {
  id: string;
  titulo: string;
  // Caso queira exibir o autor principal, ou ainda combinar com a lista completa de autores:
  autores_artigo: string;
  autor_principal: string;
  // O campo 'fonte' pode ser utilizado se for necessário:
  fonte?: string;
  doi: string;
  issn: string;
  isbn: string;
  volume: string;
  // O campo 'numero' pode ser usado se for importante, ou pode ser ignorado:
  numero?: string;
  paginas: string;
  editor?: string;
  // A data de publicação pode vir completa; se quiser apenas o ano, você pode extrair:
  data_publicacao: string;
  descricao?: string;
  // Para palavras-chave, tentamos usar keywords ou palavras_chave:
  palavras_chave: string;
  // Número de citações:
  citacoes: string;
  // Quantidade de citações (pode vir em outro campo, se necessário)
  citedByCount?: string;
  tipo: string;
  // Caso queira usar o article_number, pode mapear também:
  articleNumber?: string;
  departamento?: string;
  origem: string;
  financiador: string;
  repositorioIPBeja: string;
  apoiosPublicacao: string;
  afiliacoes: string;
  // Se houver IDs de autores ORCID:
  orcids_autores: string;
  // Organizações dos autores:
  organizacoes: string;
  // Outros campos que não serão usados na exibição podem ser omitidos ou mapeados se necessário:
  // fonteTitulo, issue, paginasInicio, paginasFim, numeroPaginas, etc.
}
export interface DashboardData {
  totalArticles: number;
  revistaCount: number;
  capituloCount: number;
  conferenciaCount: number;
  outroCount: number;
  percentages: {
    revista: string;
    capitulo: string;
    conferencia: string;
    outro: string;
  };
}


export interface Publication {

  artigo: Article;
  paginas?: string;

}

export interface Ivestigator {
  id: number;
  nome: string;
  orcid: string;
  departamento:string;
  cnaef:string;
}

export interface Curso {
  codigo: string;
  nome: string;
  ciclo: string;
  escola: string;
  cnaefs: string[];
}

