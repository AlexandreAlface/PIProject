<?php

namespace App\Services\ArtigosServices;

use App\Models\Orcid;
use App\Services\KeyService\ApiKeyValidator;
use App\Models\ApiKey;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class ArtigosScopusService
{
    private $apiKey;
    private $client;

    /**
     * Construtor: Verifica a chave da Elsevier e inicializa o client.
     */
    public function __construct(ApiKeyValidator $apiKeyValidator, Client $client)
    {
        if (!$apiKeyValidator->checkElsevierKey()) {
            throw new \Exception('Chave da Elsevier inválida ou expirada.');
        }
        $this->client = $client;
        $this->apiKey = $this->getApiKey();
    }

    /**
     * Retorna a API Key da Elsevier.
     */
    private function getApiKey(): string
    {
        $key = ApiKey::where('service_name', 'Elsevier')->first();
        if (!$key || !$key->api_key) {
            throw new \Exception('API Key for Elsevier not found.');
        }
        return $key->api_key;
    }

    /**
     * Obtém os artigos do Scopus para cada ORCID registado e guarda os resultados em CSV.
     */
    public function getArtigosScopus(): array
    {
        $orcids = Orcid::where('orcid', '!=', 'N/A')->pluck('orcid')->toArray();
        $artigosScopus = [];
        $maxOrcidsPerQuery = 4;
        foreach (array_chunk($orcids, $maxOrcidsPerQuery) as $subset) {
            foreach ($subset as $orcid) {
                $query = "ORCID($orcid)";
                $artigos = $this->fetchArtigosByQuery($query, $orcid);
                $artigosScopus = array_merge($artigosScopus, $artigos);
            }
        }
        $this->saveArtigosScopus($artigosScopus);
        return $artigosScopus;
    }

    /**
     * Executa a pesquisa no Scopus com paginação.
     */
    private function fetchArtigosByQuery(string $query, string $orcid): array
    {
        $artigos = [];
        $offset = 0;
        $limit = 25;
        $totalResults = PHP_INT_MAX;
        while ($offset < $totalResults) {
            try {
                $response = $this->client->get(env('SCOPUS_URL'), [
                    'headers' => [
                        'X-ELS-APIKey' => $this->apiKey,
                        'Accept' => 'application/json'
                    ],
                    'query' => [
                        'query' => $query,
                        'start' => $offset,
                        'count' => $limit,
                        'view' => 'COMPLETE'
                    ],
                ]);
                $data = json_decode($response->getBody()->getContents(), true);
                if ($totalResults === PHP_INT_MAX) {
                    $totalResults = (int)($data['search-results']['opensearch:totalResults'] ?? 0);
                }
                $entries = $data['search-results']['entry'] ?? [];
                foreach ($entries as $entry) {
                    // Verifica se existe uma chave "error" no entry
                    if (isset($entry['error'])) {
                        // Regista o erro se necessário e sai do loop ou ignora este entry
                        break; // ou continue; se quiseres apenas ignorar este entry e continuar
                    }
                    $dadosExtraidos = $this->extrairInformacaoCompletaDoArtigo($entry, $orcid);
                    $artigos[] = $dadosExtraidos;
                }
                if (count($entries) === 0) {
                    break;
                }
                $offset += $limit;
            } catch (\Exception $e) {
                Log::error("Erro ao buscar artigos Scopus: " . $e->getMessage());
                break;
            }
        }
        return $artigos;
    }

    /**
     * Junta os dados do cabeçalho com os dados dos autores atualizados.
     */
    private function extrairInformacaoCompletaDoArtigo(array $entry, string $orcidUtilizado): array
    {
        // O autor principal é obtido diretamente do campo da API.
        $principalDados = [
            'nome' => $entry['dc:creator'] ?? '',
            'orcid' => $orcidUtilizado
        ];
        // Neste novo cenário, não fazemos matching; simplesmente usamos o valor recebido.
        $principalAtualizado = $principalDados;
        $cabecalho = $this->extrairCabecalhoArtigo($entry, $principalAtualizado);
        $autores = $this->extrairEAtualizarAutores($entry, $orcidUtilizado);
        return array_merge($cabecalho, $autores);
    }

    /**
     * Extrai os campos principais do artigo, usando o autor principal.
     */
    private function extrairCabecalhoArtigo(array $entry, array $principalAtualizado): array
    {
        return [
            'id' => $entry['dc:identifier'] ?? '',
            'titulo' => $entry['dc:title'] ?? '',
            'autor_principal' => $principalAtualizado['nome'],
            'fonte' => $entry['prism:publicationName'] ?? '',
            'doi' => $entry['prism:doi'] ?? '',
            'issn' => $entry['prism:issn'] ?? '',
            'isbn' => $this->extrairISBN($entry),
            'volume' => $entry['prism:volume'] ?? '',
            'numero' => $entry['prism:issueIdentifier'] ?? '',
            'paginas' => $entry['prism:pageRange'] ?? '',
            'editor' => $entry['dc:publisher'] ?? '',
            'data_publicacao' => $entry['prism:coverDate'] ?? '',
            'descricao' => $entry['dc:description'] ?? '',
            'palavras_chave' => $this->formatarKeywords($entry['authkeywords'] ?? ''),
            'cited_by_count' => $entry['citedby-count'] ?? '0',
            'tipo' => $entry['subtypeDescription'] ?? '',
            'article_number' => $entry['article-number'] ?? '',
            'departamento' => Orcid::where('orcid', $principalAtualizado['orcid'] ?? '')->value('departamento'),
            'origem' => 'Scopus',
            'financiador' => $this->extrairFinanciadores($entry),
            'afiliacoes' => $this->extrairAfilicoes($entry),
            'repositorioIPBeja' => 'N/A',
            'apoiosPublicacao' => 'N/A'
        ];
    }

    private function extrairAfilicoes(array $entry): string
    {
        $afiliacoes = [];

        if (!empty($entry['affiliation']) && is_array($entry['affiliation'])) {
            foreach ($entry['affiliation'] as $afiliacao) {
                $nomeAfiliacao = $afiliacao['affilname'] ?? 'N/A';
                $cidade = $afiliacao['affiliation-city'] ?? 'N/A';
                $pais = $afiliacao['affiliation-country'] ?? 'N/A';

                // Formatação para garantir a legibilidade dos dados
                $afiliacoes[] = trim("$nomeAfiliacao ($cidade, $pais)");
            }
        }

        return (!empty($afiliacoes)) ? implode("; ", $afiliacoes) : "N/A";
    }

    /**
     * Extrai e processa os autores do artigo.
     * Nesta versão, não fazemos matching com a base; usamos os dados conforme a API.
     * Ao final, garantimos que o ORCID utilizado na pesquisa está incluído no array.
     */
    private function extrairEAtualizarAutores(array $entry, string $orcidUtilizado): array
    {
        $autores = $this->extrairAutoresCompleto($entry);
        $nomes = implode('; ', array_column($autores, 'nome'));
        $orcids = array_column($autores, 'orcid');

        // Se o ORCID da pesquisa ainda não estiver presente, adiciona-o
        if (!in_array($orcidUtilizado, $orcids)) {
            $orcids[] = $orcidUtilizado;
        }

        // Removendo duplicatas corretamente
        $orcids = array_unique($orcids);

        $orcidsStr = implode('; ', $orcids);

        return [
            'autores_artigo' => $nomes,
            'orcid_autores' => $orcidsStr
        ];
    }


    /**
     * Extrai os autores do artigo conforme retornados pela API.
     */
    private function extrairAutoresCompleto(array $entry): array
    {
        $autoresArray = $entry['author'] ?? [];
        $resultado = [];
        foreach ($autoresArray as $autor) {
            $given = $autor['given-name'] ?? '';
            $family = $autor['surname'] ?? '';
            $orcid = (!empty($autor['orcid'])) ? $autor['orcid'] : 'N/A';
            $nome = trim("$given $family") ?: '';
            $resultado[] = ['nome' => $nome, 'orcid' => $orcid];
        }
        return $resultado;
    }

    /**
     * Extrai o ISBN do artigo.
     */
    private function extrairISBN(array $entry): string
    {
        if (!empty($entry['prism:isbn']) && is_array($entry['prism:isbn'])) {
            $lista = array_map(function ($item) {
                return isset($item['$']) ? $item['$'] : '';
            }, $entry['prism:isbn']);
            return implode(', ', $lista);
        }
        return '';
    }

    /**
     * Formata as palavras-chave substituindo '|' por ';'.
     */
    private function formatarKeywords($authKeywords): string
    {
        if (is_array($authKeywords)) {
            return implode('; ', $authKeywords);
        }
        if (is_string($authKeywords)) {
            return trim(str_replace('|', ';', $authKeywords));
        }
        return '';
    }

    /**
     * Extrai os dados dos financiadores do artigo.
     */
    private function extrairFinanciadores(array $entry): string
    {
        $acr = $entry['fund-acr'] ?? '';
        $no = $entry['fund-no'] ?? '';
        $sponsor = $entry['fund-sponsor'] ?? '';
        $fin = trim("$acr " . ($no !== 'undefined' ? "($no)" : '') . " $sponsor");
        return (empty(trim($fin)) || $fin === '()') ? 'N/A' : $fin;
    }

    /**
     * Processa um valor para escrita em CSV.
     */
    private function processarValor($valor): string
    {
        if (is_array($valor)) {
            return implode(', ', array_map([$this, 'processarValor'], $valor));
        }
        if (is_object($valor)) {
            return json_encode($valor);
        }
        return is_scalar($valor) ? (string)$valor : 'N/A';
    }

    /**
     * Guarda os artigos num ficheiro CSV.
     */
    private function saveArtigosScopus(array $artigos)
    {
        $filePath = storage_path('Ficheiros/Artigos/Scopus/artigos-Scopus-' . date('Y-m-d') . '.csv');
        try {
            $file = fopen($filePath, 'w');
            if ($file === false) {
                throw new \Exception("Não foi possível abrir o ficheiro para escrita: $filePath");
            }
            if (!empty($artigos)) {
                $header = array_keys($artigos[0]);
                fputcsv($file, $header);
                foreach ($artigos as $artigo) {
                    $linha = [];
                    foreach ($header as $campo) {
                        $linha[] = $this->processarValor($artigo[$campo] ?? 'N/A');
                    }
                    fputcsv($file, $linha);
                }
            } else {
                throw new \Exception("Nenhum artigo disponível para guardar.");
            }
            fclose($file);
        } catch (\Exception $e) {
            Log::error("Erro ao guardar artigos Scopus: " . $e->getMessage());
        }
    }
}
