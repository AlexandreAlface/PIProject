<?php

namespace App\Services\ArtigosServices;

use App\Models\ApiKey;
use App\Models\Orcid;
use App\Services\KeyService\ApiKeyValidator;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class ArtigosWOSService
{
    private Client $client;
    private string $apiKey;
    private ArtigosUnificadosService $artigosUnificadosService;

    /**
     * Construtor: Inicializa o client, o serviço de unificação e verifica a chave Clarivate.
     */
    public function __construct(Client $client, ApiKeyValidator $apiKeyValidator, ArtigosUnificadosService $uniService)
    {
        $this->client = $client;
        $this->artigosUnificadosService = $uniService;

        if (!$apiKeyValidator->checkClarivateKey()) {
            throw new \Exception('Chave da Clarivate inválida ou expirada.');
        }
        $this->apiKey = $this->fetchApiKey();
    }

    /**
     * Retorna a API Key da Clarivate.
     */
    private function fetchApiKey(): string
    {
        $key = ApiKey::where('service_name', 'Clarivate')->first();
        if (!$key || !$key->api_key) {
            throw new \Exception('API Key for Clarivate not found.');
        }
        return $key->api_key;
    }

    /**
     * Obtém os artigos do WOS para cada subconjunto de ORCIDs usados na pesquisa e os salva em CSV.
     * Faz paginação completa (todas as páginas).
     */
    public function getArtigosWOS(): array
    {
        // Obtém os ORCIDs da BD
        $orcids = Orcid::where('orcid', '!=', 'N/A')->pluck('orcid')->toArray();
        $artigosWOS = [];
        $maxOrcidsPerQuery = 4;
        foreach (array_chunk($orcids, $maxOrcidsPerQuery) as $subset) {
            $query = $this->buildOrcidQuery($subset);
            $artigosWOS = array_merge($artigosWOS, $this->fetchArtigosByQuery($query, $subset));
        }
        $this->saveArtigosWOS($artigosWOS);
        return $artigosWOS;
    }

    /**
     * Constrói a query para o WOS a partir de um array de ORCIDs.
     * Exemplo: "AI=(0000-0001-2345-6789) OR AI=(0000-0002-9876-5432)"
     */
    private function buildOrcidQuery(array $orcids): string
    {
        return implode(' OR ', array_map(fn($orcid) => "AI=($orcid)", $orcids));
    }

    /**
     * Executa a pesquisa no WOS paginando até o final.
     */
    private function fetchArtigosByQuery(string $orcidQuery, array $orcidsPesquisa): array
    {
        $artigos = [];
        $page = 1;
        $totalPages = PHP_INT_MAX;
        do {
            try {
                $response = $this->client->get(env('WOS_URL'), [
                    'headers' => ['X-ApiKey' => $this->apiKey],
                    'query' => [
                        'q' => $orcidQuery,
                        'page' => $page,
                    ],
                ]);
                $data = json_decode($response->getBody()->getContents(), true);
                if ($totalPages === PHP_INT_MAX) {
                    $totalResults = $data['metadata']['total'] ?? 0;
                    $limit = $data['metadata']['limit'] ?? 10;
                    $totalPages = ceil($totalResults / $limit);
                }
                $entries = $data['hits'] ?? [];
                foreach ($entries as $entry) {
                    $artigos[] = $this->extrairInformacaoDoArtigo($entry, $orcidsPesquisa);
                }
                $page++;
            } catch (\Exception $e) {
                Log::error("Erro ao buscar artigos WOS (página $page): " . $e->getMessage());
                break;
            }
        } while ($page <= $totalPages);
        return $artigos;
    }

    /**
     * Extrai as informações do artigo, combinando os dados do WOS com os investigadores.
     */
    private function extrairInformacaoDoArtigo(array $entry, array $orcidsPesquisa): array
    {
        $titulo = $entry['title'] ?? '';
        $fonte = $entry['source']['sourceTitle'] ?? '';
        $doi = $entry['identifiers']['doi'] ?? '';
        $ano = $entry['source']['publishYear'] ?? '';
        $mes = $entry['source']['publishMonth'] ?? '';
        $id = $entry['uid'] ?? '';

        // Extrai os nomes dos autores do WOS (campo names.authors.displayName)
        $autoresData = $entry['names']['authors'] ?? [];
        $wosAuthorNames = array_column($autoresData, 'displayName');
        $autoresOrganizados = $this->organizarNomes($wosAuthorNames);

        // Faz o match: obtém os ORCIDs correspondentes aos autores
        $orcidsMatch = $this->matchOrcidsParaAutores($autoresOrganizados, $orcidsPesquisa);
        $orcidString = implode('; ', $orcidsMatch);

        return [
            'id' => $id,
            'titulo' => $titulo,
            'tipo' => $entry['sourceTypes'] ?? [],
            'fonteTitulo' => $fonte,
            'data_publicacao' => $this->formatarDataPublicacao($ano, $mes),
            'volume' => $entry['source']['volume'] ?? '',
            'issue' => $entry['source']['issue'] ?? '',
            'paginas' => $entry['source']['pages']['range'] ?? '',
            'paginasInicio' => $entry['source']['pages']['begin'] ?? '',
            'paginasFim' => $entry['source']['pages']['end'] ?? '',
            'numeroPaginas' => $entry['source']['pages']['count'] ?? '',
            'doi' => $doi,
            'autores_artigo' => implode('; ', $autoresOrganizados),
            'orcid_autores' => $orcidString,
            'departamento' => $this->obterDepartamentoDoInvestigador($orcidsMatch),
            'origem' => 'WOS',
            'financiador' => "N/A",
            'repositorioIPBeja' => "N/A",
            'apoiosPublicacao' => "N/A",
        ];
    }

    /**
     * Organiza os nomes dos autores, tentando converter de "Sobrenome, Nome" para "Nome Sobrenome".
     */
    private function organizarNomes(array $autores): array
    {
        return array_map(function ($autor) {
            $parts = explode(',', $autor);
            if (count($parts) === 2) {
                $nome = trim($parts[1]);
                $sobrenome = trim($parts[0]);
                return $nome . ' ' . $sobrenome;
            }
            return $autor;
        }, $autores);
    }

    /**
     * Faz o match entre os nomes dos autores retornados pelo WOS e os investigadores da BD,
     * considerando apenas os investigadores cujos ORCIDs estão na lista de ORCIDs da pesquisa.
     * Para cada nome do WOS:
     * - Se o nome estiver parcialmente abreviado, usa a função matchAbreviado.
     * - Caso contrário, tenta:
     *   a) Verificar se o nome completo da BD possui pelo menos 3 tokens; se sim, retorna match se pelo menos
     *      o primeiro e o último tokens (ou pelo menos 2 tokens) coincidirem com o nome do WOS.
     *   b) Se não for possível, tenta com os 2 tokens (primeiro e último).
     * - Se nenhum destes critérios der match, usa similar_text() com limiar de 70%.
     *
     * @param array $wosAuthorNames Lista de nomes dos autores retornados pelo WOS.
     * @param array $orcidsPesquisa Lista de ORCIDs usados na pesquisa.
     * @return array Array único de ORCIDs que deram match.
     */
    private function matchOrcidsParaAutores(array $wosAuthorNames, array $orcidsPesquisa): array
    {
        $matches = [];
        $investigadores = Orcid::whereIn('orcid', $orcidsPesquisa)->get(['name', 'orcid']);

        foreach ($wosAuthorNames as $wosName) {
            $wosName = trim($wosName);
            if (empty($wosName)) {
                continue;
            }
            $matchedOrcid = '';
            if ($this->isNomeParcialmenteAbreviado($wosName)) {
                // Se o nome estiver parcialmente abreviado, usa a lógica de match abreviado
                foreach ($investigadores as $inv) {
                    if ($inv->orcid === 'N/A' || empty($inv->name)) {
                        continue;
                    }
                    if ($this->matchAbreviado($wosName, $inv->name)) {
                        $matchedOrcid = $inv->orcid;
                        break;
                    }
                }
            } else {
                // Se o nome não estiver abreviado, tokeniza e verifica:
                $wosTokens = preg_split('/\s+/', $this->normalizarNome($wosName));
                foreach ($investigadores as $inv) {
                    if ($inv->orcid === 'N/A' || empty($inv->name)) {
                        continue;
                    }
                    $dbTokens = preg_split('/\s+/', $this->normalizarNome($inv->name));
                    if (count($dbTokens) >= 3) {
                        // Tenta match com pelo menos primeiro e último tokens
                        if (in_array($dbTokens[0], $wosTokens) && in_array(end($dbTokens), $wosTokens)) {
                            $matchedOrcid = $inv->orcid;
                            break;
                        }
                    } elseif (count($dbTokens) >= 2) {
                        // Se houver apenas 2 tokens, exige ambos
                        if (in_array($dbTokens[0], $wosTokens) && in_array($dbTokens[1], $wosTokens)) {
                            $matchedOrcid = $inv->orcid;
                            break;
                        }
                    }
                    // Fallback: similar_text
                    similar_text($this->normalizarNome($wosName), $this->normalizarNome($inv->name), $percent);
                    if ($percent >= 70) {
                        $matchedOrcid = $inv->orcid;
                        break;
                    }
                }
            }
            if (!empty($matchedOrcid)) {
                $matches[] = $matchedOrcid;
            }
        }
        return array_unique($matches);
    }

    /**
     * Verifica se um nome é considerado "parcialmente abreviado".
     * Retorna true se pelo menos 50% dos tokens tiverem 3 ou menos caracteres.
     *
     * @param string $nome
     * @param float $threshold
     * @return bool
     */
    private function isNomeParcialmenteAbreviado(string $nome, float $threshold = 0.5): bool
    {
        $parts = preg_split('/\s+/', trim($nome));
        if (empty($parts)) {
            return false;
        }
        $abbrCount = 0;
        foreach ($parts as $part) {
            if (strlen($part) <= 3) {
                $abbrCount++;
            }
        }
        return ($abbrCount / count($parts)) >= $threshold;
    }

    /**
     * Compara dois nomes quando o nome do WOS está abreviado.
     * Extrai as iniciais (concatenadas de todas as partes, exceto a última) e o sobrenome.
     * Retorna true se os sobrenomes coincidirem e se as iniciais do nome do WOS estiverem contidas
     * nas iniciais do nome da BD.
     *
     * @param string $wosName Nome possivelmente abreviado retornado pelo WOS.
     * @param string $dbName Nome completo do investigador da BD.
     * @return bool
     */
    private function matchAbreviado(string $wosName, string $dbName): bool
    {
        $wosData = $this->extrairIniciaisESobrenome($wosName);
        $dbData = $this->extrairIniciaisESobrenome($dbName);
        if ($wosData['lastname'] !== $dbData['lastname']) {
            return false;
        }
        return (strpos($dbData['initials'], $wosData['initials']) !== false);
    }

    /**
     * Extrai as iniciais (concatenadas) e o sobrenome de um nome.
     * Por exemplo: "AC Pardal" retorna ['initials' => 'ac', 'lastname' => 'pardal'].
     *
     * @param string $nome
     * @return array Array com as chaves 'initials' e 'lastname'
     */
    private function extrairIniciaisESobrenome(string $nome): array
    {
        $parts = preg_split('/\s+/', trim($nome));
        if (empty($parts)) {
            return ['initials' => '', 'lastname' => ''];
        }
        $lastname = strtolower(end($parts));
        $initials = '';
        for ($i = 0; $i < count($parts) - 1; $i++) {
            $initials .= substr($parts[$i], 0, 1);
        }
        return ['initials' => strtolower($initials), 'lastname' => $lastname];
    }

    /**
     * Normaliza um nome removendo acentos, caracteres especiais e convertendo para minúsculas.
     *
     * @param string $nome
     * @return string
     */
    private function normalizarNome(string $nome): string
    {
        return strtolower(trim(preg_replace('/[^a-z0-9\s]/u', '', iconv('UTF-8', 'ASCII//TRANSLIT', $nome))));
    }

    /**
     * Obtém o departamento do investigador a partir da lista de ORCIDs que deram match.
     *
     * @param array $orcidsMatch
     * @return string
     */
    private function obterDepartamentoDoInvestigador(array $orcidsMatch): string
    {
        foreach ($orcidsMatch as $orcid) {
            $dept = Orcid::where('orcid', $orcid)->value('departamento');
            if ($dept) {
                return $dept;
            }
        }
        return '';
    }

    /**
     * Formata a data de publicação no formato YYYY-MM-DD.
     *
     * @param string $ano
     * @param string $mes
     * @return string
     */
    private function formatarDataPublicacao(string $ano, string $mes): string
    {
        if (empty($ano)) {
            return '';
        }
        $meses = [
            'JAN' => '01', 'FEB' => '02', 'MAR' => '03', 'APR' => '04',
            'MAY' => '05', 'JUN' => '06', 'JUL' => '07', 'AUG' => '08',
            'SEP' => '09', 'OCT' => '10', 'NOV' => '11', 'DEC' => '12'
        ];
        $partes = explode(' ', strtoupper($mes));
        $mesAbreviado = $partes[0] ?? 'JAN';
        $dia = $partes[1] ?? '01';
        $mesNumerico = $meses[$mesAbreviado] ?? '01';
        return sprintf('%s-%s-%02d', $ano, $mesNumerico, (int)$dia);
    }

    /**
     * Processa um valor para escrita em CSV, convertendo arrays e objetos em strings.
     *
     * @param mixed $valor
     * @return string
     */
    private function processarValor($valor): string
    {
        if (is_array($valor)) {
            return implode(', ', array_map([$this, 'processarValor'], $valor));
        }
        if (is_object($valor)) {
            return json_encode($valor);
        }
        return is_scalar($valor) ? (string)$valor : '';
    }

    /**
     * Guarda os artigos num ficheiro CSV.
     *
     * @param array $artigos
     * @return void
     */
    private function saveArtigosWOS(array $artigos): void
    {
        $filePath = storage_path('Ficheiros/Artigos/WBS/artigos-WBS-' . date('Y-m-d') . '.csv');
        try {
            $file = fopen($filePath, 'w');
            if ($file === false) {
                throw new \Exception("Não foi possível abrir o arquivo para escrita: $filePath");
            }
            if (!empty($artigos)) {
                $header = array_keys($artigos[0]);
                fputcsv($file, $header);
                foreach ($artigos as $artigo) {
                    $linha = [];
                    foreach ($header as $campo) {
                        $linha[] = $this->processarValor($artigo[$campo] ?? '');
                    }
                    fputcsv($file, $linha);
                }
            } else {
                throw new \Exception("Nenhum artigo disponível para guardar.");
            }
            fclose($file);
        } catch (\Exception $e) {
            Log::error("Erro ao guardar artigos WOS: " . $e->getMessage());
        }
    }
}
