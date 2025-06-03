export const DEPARTMENTS = [
  { acronym: 'D-AHD', name: 'Artes, Humanidades e Desporto' },
  { acronym: 'D-BIO', name: 'Biociências' },
  { acronym: 'D-CE', name: 'Ciências Empresariais' },
  { acronym: 'D-ESCS', name: 'Educação e Ciências Sociais e do Comportamento' },
  { acronym: 'D-ENG', name: 'Engenharia' },
  { acronym: 'D-MCF', name: 'Matemática e Ciências Físicas' },
  { acronym: 'D-SA', name: 'Saúde' },
  { acronym: 'D-TCA', name: 'Tecnologia e Ciências Aplicadas' },
];

export const DEPARTMENT_NAME_MAPPING: { [key: string]: string } = DEPARTMENTS.reduce(
  (map, department) => {
    map[department.acronym] = department.name;
    return map;
  },
  {} as { [key: string]: string }
);

export const departmentMapping: { [key: string]: string } = {
  "Artes H Desporto": "D-AHD",
  "Biociências": "D-BIO",
  "Ciências Empresariais": "D-CE",
  "Educação CSComportamento": "D-ESCS",
  "Engenharia": "D-ENG",
  "Matemática CFisicas": "D-MCF",
  "Saúde": "D-SA",
  "Tecnologias CAplicadas": "D-TCA",
  "Tecnologias Caplicadas": "D-TCA", // Cobrindo variação ortográfica
  "N/A": "N/A"
};

export const CNAEF_BY_DEPARTMENT: { [department: string]: string[] } = {
  "Artes, Humanidades e Desporto": [
    // Extraído de "Artes H Desporto"
    "142", "143", "144", "146", // (ex.: formação de professores e áreas afins)
    "211", "212", "213", "214", // (ex.: Belas-Artes, Artes do Espectáculo, etc.)
    "222", "223", "226",       // (ex.: Línguas, Literatura, Filosofia, etc.)
    "312", "813"               // (ex.: Psicologia/Comunicação e Desporto)
  ],
  "Biociências": [
    // Extraído de "Biociências"
    "421", "422", "621", "629", "640", "852"
  ],
  "Ciências Empresariais": [
    // Extraído de "Ciências Empresariais"
    "312", "314", "344", "345", "380", "812"
  ],
  "Educação e Ciências Sociais e do Comportamento": [
    // Extraído de "Educação CSComportamento"
    "142", "143", "144", "145", // (ex.: formação de professores)
    "310", "311", "312", "762"
  ],
  "Engenharia": [
    // Extraído de "Engenharia"
    "345", "380", "419", "422",
    "441", "443", "481", "523",
    "581", "582", "851", "862"
  ],
  "Matemática e Ciências Físicas": [
    // Extraído de "Matemática CFisicas"
    "140", "142", "145",
    "441", "443", "461", "462", "582"
  ],
  "Saúde": [
    // Extraído de "Saúde"
    "142", "311", "422",
    "721", "723", "726", "729"
  ],
  "Tecnologia e Ciências Aplicadas": [
    // União dos códigos de "Tecnologias CAplicadas" e "Tecnologias Caplicadas"
    "421", "442", "524", "541",
    "726", "727", "851", "853"
  ]
};

export const AREA_CODE_MAPPING: { [key: string]: string } = {
  "142": "Ciências da Educação",
  "143": "Formação de Educadores de Infância",
  "144": "Formação de Professores do Ensino Básico (1.º e 2.º Ciclos)",
  "145": "Formação de Professores de Áreas Disciplinares Específicas",
  "146": "Formação de Professores e Formadores de Áreas Tecnológicas",
  "211": "Belas-Artes",
  "212": "Artes do Espectáculo",
  "213": "Áudio-Visuais e Produção dos Media",
  "214": "Design",
  "215": "Artesanato",
  "221": "Religião e Teologia",
  "222": "Línguas e Literaturas Estrangeiras",
  "223": "Língua e Literatura Materna",
  "225": "História e Arqueologia",
  "226": "Filosofia e Ética",
  "229": "Humanidades",
  "311": "Psicologia",
  "312": "Sociologia e Outros Estudos",
  "313": "Ciência Política e Cidadania",
  "314": "Economia",
  "319": "Ciências Sociais e do Comportamento",
  "321": "Jornalismo e Reportagem",
  "322": "Biblioteconomia, Arquivo e Documentação (BAD)",
  "329": "Informação e Jornalismo",
  "341": "Comércio",
  "342": "Marketing e Publicidade",
  "343": "Finanças, Banca e Seguros",
  "344": "Contabilidade e Fiscalidade",
  "345": "Gestão e Administração",
  "346": "Secretariado e Trabalho Administrativo",
  "347": "Enquadramento na Organização/Empresa",
  "349": "Ciências Empresariais",
  "380": "Direito",
  "421": "Biologia e Bioquímica",
  "422": "Ciências do Ambiente",
  "429": "Ciências da Vida",
  "441": "Física",
  "442": "Química",
  "443": "Ciências da Terra",
  "461": "Matemática",
  "462": "Estatística",
  "481": "Ciências Informáticas",
  "482": "Informática na Óptica do Utilizador",
  "489": "Informática",
  "521": "Metalurgia e Metalomecânica",
  "522": "Electricidade e Energia",
  "523": "Electrónica e Automação",
  "524": "Tecnologia dos Processos Químicos",
  "525": "Construção e Reparação de Veículos a Motor",
  "529": "Engenharia e Técnicas Afins",
  "541": "Indústrias Alimentares",
  "542": "Indústrias do Têxtil, Vestuário, Calçado e Couro",
  "543": "Materiais (Indústrias da Madeira, Cortiça, Papel, Plástico, Vidro e outros)",
  "544": "Indústrias Extractivas",
  "549": "Indústrias Transformadoras",
  "581": "Arquitectura e Urbanismo",
  "582": "Construção Civil e Engenharia Civil",
  "620": "Agricultura, silvicultura e pescas",
  "621": "Produção Agrícola e Animal",
  "622": "Floricultura e Jardinagem",
  "623": "Silvicultura e Caça",
  "624": "Pescas",
  "640": "Ciências Veterinárias",
  "721": "Medicina",
  "723": "Enfermagem",
  "724": "Ciências Dentárias",
  "725": "Tecnologias de Diagnóstico e Terapêutica",
  "726": "Terapia e Reabilitação",
  "727": "Ciências Farmacêuticas",
  "729": "Saúde",
  "761": "Serviços de Apoio a Crianças e Jovens",
  "762": "Trabalho Social e Orientação",
  "811": "Hotelaria e Restauração",
  "812": "Turismo e Lazer",
  "813": "Desporto",
  "819": "Serviços Pessoais",
  "840": "Serviços de Transporte",
  "851": "Tecnologia de Protecção do Ambiente",
  "852": "Ambientes Naturais e Vida Selvagem",
  "853": "Serviços de Saúde Pública",
  "861": "Protecção de Pessoas e Bens",
  "862": "Segurança e Higiene no Trabalho",
  "863": "Segurança Militar"
};
