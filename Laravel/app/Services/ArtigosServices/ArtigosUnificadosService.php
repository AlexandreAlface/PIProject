<?php

namespace App\Services\ArtigosServices;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ArtigosUnificadosService
{
    public function unificarArtigos(): array
    {
        $dadosWBS = $this->getArtigosWBS();
        $dadosScopus = $this->getArtigosScopus();

        $parametros = $this->carregarParametros();

        $artigosUnificados = $this->unificarDados($dadosWBS, $dadosScopus, $parametros);

        $colunasComuns = $this->identificarColunasComuns($dadosWBS, $dadosScopus);

        $this->gerarCSVComCabecalho($artigosUnificados, $colunasComuns);

        return $artigosUnificados;
    }

    private function carregarParametros(): array
    {
        $caminhoArquivo = storage_path('Ficheiros/Artigos/Parametros/parametros.csv');

        if (!file_exists($caminhoArquivo)) {
            return [];
        }

        $file = fopen($caminhoArquivo, 'r');
        $parametros = [];
        $header = null;

        while (($linha = fgetcsv($file)) !== false) {
            if (!$header) {
                $header = array_map('trim', $linha);
            } else {
                if (count($linha) === count($header)) {
                    $artigo = array_combine($header, $linha);
                    $chaveId = strtolower(trim($artigo['id']));
                    $chaveTitulo = strtolower(trim($artigo['titulo']));
                    $parametros[$chaveId] = $artigo;
                    $parametros[$chaveTitulo] = $artigo;
                }
            }
        }

        fclose($file);
        return $parametros;
    }

    private function identificarColunasComuns(array $dadosWBS, array $dadosScopus): array
    {
        if (empty($dadosWBS) || empty($dadosScopus)) {
            return [];
        }
        $colunasWBS = array_keys(reset($dadosWBS));
        $colunasScopus = array_keys(reset($dadosScopus));
        return array_intersect($colunasWBS, $colunasScopus);
    }

    /**
     * Gera a chave de unificação para um artigo.
     * Se o DOI existir e for válido, utiliza-o; caso contrário, gera um hash MD5
     * formado a partir do título normalizado para comparação concatenado com a data de publicação.
     */
    private function gerarChaveArtigo(array $artigo): string
    {
        $doi = strtolower(trim($artigo['doi'] ?? ''));
        if (!empty($doi) && $doi !== 'n/a') {
            return $doi;
        }
        // Para artigos sem DOI, utiliza título e data para gerar a chave
        $titulo = $this->normalizarTituloParaComparacao($artigo['titulo'] ?? '');
        $data = trim($artigo['data_publicacao'] ?? '');
        return md5($titulo . $data);
    }

    /**
     * Unifica os dados dos artigos de duas fontes (WBS e Scopus).
     *
     * - Para os artigos da Scopus: Processa um a um. Se o artigo tiver o mesmo id de um já unificado,
     *   os dados (por exemplo, os ORCID) são combinados.
     * - Depois, para os artigos do WBS: Se o id já existir, combina os dados; senão,
     *   procura um artigo unificado igual (pela comparação de DOI ou, se faltar, pelo título normalizado).
     *   Se encontrar, mescla e atualiza a origem para "WBS/Scopus"; se não, adiciona como novo registro.
     */
    private function unificarDados(array $dadosWBS, array $dadosScopus, array $parametros): array
    {
        $indicesUnicos = [];

        // --- Processa os dados da Scopus ---
        foreach ($dadosScopus as $scopus) {
            // Ignorar artigos do tipo "Review"
            if (isset($scopus['tipo']) && stripos($scopus['tipo'], 'review') !== false) {
                continue;
            }

            // Verifica se já existe um artigo com o mesmo id
            $idScopus = $scopus['id'] ?? '';
            $keyExistente = $this->getArticleKeyById($idScopus, $indicesUnicos);
            if ($keyExistente !== false) {
                // Combina os ORCID (e demais campos, conforme regras) e continua
                $indicesUnicos[$keyExistente] = $this->combinarArtigos($indicesUnicos[$keyExistente], $scopus);
                continue;
            }


            $scopus = $this->reutilizarParametros($scopus, $parametros, $scopus['id'] ?? null, $this->normalizarTituloParaComparacao($scopus['titulo'] ?? ''));
            $scopus['tipo'] = $this->uniformizarTipo($scopus['tipo']);

            // Gera a chave base (DOI ou hash(título + data))
            $chaveBase = $this->gerarChaveArtigo($scopus);
            $chave = $chaveBase;
            $counter = 1;
            while (isset($indicesUnicos[$chave])) {
                $chave = $chaveBase . '-' . $counter;
                $counter++;
            }
            $scopus['origem'] = 'Scopus';
            $indicesUnicos[$chave] = $scopus;
        }

        // --- Processa os dados do WBS ---
        foreach ($dadosWBS as $wbs) {
            // Ignorar artigos do tipo "Review"
            if (isset($wbs['tipo']) && stripos($wbs['tipo'], 'review') !== false) {
                continue;
            }

            // Verifica se já existe um artigo com o mesmo id
            $idWBS = $wbs['id'] ?? '';
            $keyExistente = $this->getArticleKeyById($idWBS, $indicesUnicos);
            if ($keyExistente !== false) {
                $indicesUnicos[$keyExistente] = $this->combinarArtigos($indicesUnicos[$keyExistente], $wbs);
                continue;
            }

            $wbs = $this->reutilizarParametros($wbs, $parametros, $wbs['id'] ?? null, $this->normalizarTituloParaComparacao($wbs['titulo'] ?? ''));
            $wbs['tipo'] = $this->uniformizarTipo($wbs['tipo']);

            $chaveBase = $this->gerarChaveArtigo($wbs);
            $chave = $chaveBase;
            $counter = 1;
            $achou = false;

            // Procura um artigo unificado (geralmente da Scopus) que seja igual ao WBS
            foreach ($indicesUnicos as $chaveExistente => $artigoExistente) {
                if ($this->saoArtigosIguais($artigoExistente, $wbs)) {
                    $indicesUnicos[$chaveExistente] = $this->combinarArtigos($artigoExistente, $wbs);
                    $indicesUnicos[$chaveExistente]['origem'] = 'WBS/Scopus';
                    $achou = true;
                    break;
                }
            }

            if (!$achou) {
                while (isset($indicesUnicos[$chave])) {
                    $chave = $chaveBase . '-' . $counter;
                    $counter++;
                }
                $wbs['origem'] = 'WBS';
                $indicesUnicos[$chave] = $wbs;
            }
        }

        return array_values($indicesUnicos);
    }

    /**
     * Retorna a chave do artigo unificado que possui o id informado,
     * ou false se não encontrar.
     *
     * @param string $id
     * @param array $indices
     * @return mixed
     */
    private function getArticleKeyById(string $id, array $indices)
    {
        if (empty($id)) {
            return false;
        }
        foreach ($indices as $key => $artigo) {
            if (isset($artigo['id']) && trim($artigo['id']) === trim($id)) {
                return $key;
            }
        }
        return false;
    }

    /**
     * Compara dois artigos para verificar se são efetivamente iguais.
     *
     * Critérios:
     * - Se ambos tiverem DOIs válidos e iguais, retorna true.
     * - Se o DOI estiver em falta, compara os títulos normalizados.
     *
     * A normalização do título remove acentos, vírgulas, espaços e dois-pontos (qualquer quantidade)
     * e converte tudo para minúsculas.
     *
     * @param array $art1
     * @param array $art2
     * @return bool
     */
    private function saoArtigosIguais(array $art1, array $art2): bool
    {
        $doi1 = strtolower(trim($art1['doi'] ?? ''));
        $doi2 = strtolower(trim($art2['doi'] ?? ''));
        if (!empty($doi1) && !empty($doi2) && $doi1 !== 'n/a' && $doi2 !== 'n/a') {
            return $doi1 === $doi2;
        }
        $titulo1 = $this->normalizarTituloParaComparacao($art1['titulo'] ?? '');
        $titulo2 = $this->normalizarTituloParaComparacao($art2['titulo'] ?? '');
        return $titulo1 === $titulo2;
    }

    private function uniformizarTipo(string $tipo): string
    {
        $tipoNormalizado = strtolower(trim($tipo));
        if (strpos($tipoNormalizado, 'review') !== false) {
            return 'Ignorar';
        }
        if (strpos($tipoNormalizado, 'journal') !== false || strpos($tipoNormalizado, 'article') !== false) {
            return 'Artigos em revista';
        }
        if (strpos($tipoNormalizado, 'book') !== false && strpos($tipoNormalizado, 'series') === false && strpos($tipoNormalizado, 'chapter') !== false) {
            return 'Capítulo em livro';
        }
        if (strpos($tipoNormalizado, 'book series') !== false || strpos($tipoNormalizado, 'proceedings') !== false || strpos($tipoNormalizado, 'conference') !== false || strpos($tipoNormalizado, 'meetings') !== false || strpos($tipoNormalizado, 'conference paper') !== false) {
            return 'Artigos em conferência';
        }
        return 'Outro';
    }

    private function reutilizarParametros(array $artigo, array $parametros, ?string $id, string $tituloNormalizado): array
    {
        // Utiliza o id (em minúsculas e sem espaços) para buscar os parâmetros
        $idNormalized = strtolower(trim($id));
        $parametro = $parametros[$idNormalized] ?? null;

        if ($parametro) {
            // Atualiza os campos desejados: repositorioIPBeja, apoiosPublicacao e financiador.
            $artigo['repositorioIPBeja'] = $parametro['repositorioIPBeja'] ?? $artigo['repositorioIPBeja'];
            $artigo['apoiosPublicacao'] = $parametro['apoiosPublicacao'] ?? $artigo['apoiosPublicacao'];
            $artigo['financiador'] = $parametro['financiador'] ?? $artigo['financiador'];
        }

        return $artigo;
    }

    /**
     * Combina os dados de dois artigos. Para o campo 'orcid_autores',
     * se os dois artigos tiverem valores diferentes, une-os sem duplicatas.
     *
     * @param array $artigoExistente
     * @param array $novoArtigo
     * @return array
     */
    private function combinarArtigos(array $artigoExistente, array $novoArtigo): array
    {
        foreach ($novoArtigo as $campo => $valor) {
            if ($campo === 'orcid_autores') {
                $valorExistente = $artigoExistente[$campo] ?? '';
                $arrayExistente = array_filter(array_map('trim', explode(';', $valorExistente)));
                $arrayNovo = array_filter(array_map('trim', explode(';', $valor)));
                $todosOrcids = array_unique(array_merge($arrayExistente, $arrayNovo));
                $artigoExistente[$campo] = implode('; ', $todosOrcids);
            } else {
                if (!isset($artigoExistente[$campo]) || trim($artigoExistente[$campo]) === '' || in_array(strtolower($artigoExistente[$campo]), ['undefined', 'n/a'])) {
                    $artigoExistente[$campo] = $valor;
                }
            }
        }
        return $artigoExistente;
    }

    /**
     * Normaliza o título para comparação.
     *
     * Remove acentos e converte para ASCII (ignorando caracteres ilegais),
     * remove vírgulas, espaços e dois-pontos (qualquer quantidade) e converte tudo para minúsculas.
     *
     * O título original (com os caracteres) é mantido para exibição/armazenamento,
     * mas para comparação essa normalização é aplicada.
     */
    private function normalizarTituloParaComparacao($titulo): string
    {
        $titulo = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $titulo);
        $titulo = strtolower($titulo);
        $titulo = preg_replace('/[,\s:]+/', '', $titulo);
        return $titulo;
    }

    private function gerarCSVComCabecalho(array $artigos, array $colunasComuns): void
    {
        $filePath = storage_path('Ficheiros/Artigos/Unificados/artigos-unificados-' . date('Y-m-d') . '.csv');
        $file = fopen($filePath, 'w');

        if (empty($artigos)) {
            throw new \Exception('Nenhum artigo disponível para unificar.');
        }

        $colunasTotais = array_keys(array_merge(...$artigos));
        fputcsv($file, $colunasTotais);

        foreach ($artigos as $artigo) {
            $linha = [];
            foreach ($colunasTotais as $campo) {
                $valor = $artigo[$campo] ?? 'N/A';
                $linha[] = is_array($valor) ? implode(', ', $valor) : $valor;
            }
            fputcsv($file, $linha);
        }

        fclose($file);
    }

    public function ficheiroMaisRecente(): string
    {
        $caminhoPasta = storage_path('Ficheiros/Artigos/Unificados');
        if (!\Illuminate\Support\Facades\File::isDirectory($caminhoPasta)) {
            throw new \Exception('Pasta de artigos unificados não encontrada.');
        }
        $arquivos = \Illuminate\Support\Facades\File::files($caminhoPasta);
        if (empty($arquivos)) {
            throw new \Exception('Nenhum arquivo encontrado na pasta de artigos unificados.');
        }
        $arquivoMaisRecente = collect($arquivos)
            ->sortByDesc(fn($arquivo) => $arquivo->getCTime())
            ->first();
        return $arquivoMaisRecente->getPathname();
    }

    private function carregarCSVMaisRecente(string $pasta): array
    {
        $caminhoPasta = storage_path($pasta);
        $arquivos = \Illuminate\Support\Facades\File::files($caminhoPasta);
        $maisRecente = last($arquivos);
        if (!$maisRecente) {
            return [];
        }
        $file = fopen($maisRecente, 'r');
        $dados = [];
        $header = null;
        while (($linha = fgetcsv($file)) !== false) {
            if (!$header) {
                $header = array_map('trim', $linha);
            } else {
                if (count($linha) === count($header)) {
                    $artigo = array_combine($header, $linha);
                    foreach (['organizacoes', 'keywords', 'orcid_autores', 'citacoes', 'financiador', 'repositorioIPBeja', 'apoiosPublicacao'] as $opcional) {
                        if (!isset($artigo[$opcional])) {
                            $artigo[$opcional] = 'N/A';
                        }
                    }
                    $dados[] = $artigo;
                }
            }
        }
        fclose($file);
        return $dados;
    }

    public function getArtigos(): array
    {
        $caminhoPasta = storage_path('Ficheiros/Artigos/Unificados');
        $arquivos = \Illuminate\Support\Facades\File::files($caminhoPasta);
        $maisRecente = last($arquivos);
        if (!$maisRecente) {
            return [];
        }
        $file = fopen($maisRecente, 'r');
        $dados = [];
        $header = null;
        while (($linha = fgetcsv($file)) !== false) {
            if (!$header) {
                $header = array_map('trim', $linha);
            } else {
                if (count($linha) === count($header)) {
                    $dados[] = array_combine($header, $linha);
                }
            }
        }
        fclose($file);
        return $dados;
    }

    public function getArtigosWBS(): array
    {
        return $this->carregarCSVMaisRecente('Ficheiros/Artigos/WBS');
    }

    public function getArtigosScopus(): array
    {
        return $this->carregarCSVMaisRecente('Ficheiros/Artigos/Scopus');
    }
}
