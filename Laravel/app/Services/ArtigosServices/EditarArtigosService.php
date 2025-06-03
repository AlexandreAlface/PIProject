<?php

namespace App\Services\ArtigosServices;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class EditarArtigosService
{
    /**
     * Atualiza os parâmetros e o arquivo unificado mais recente.
     */
    public function saveNovosParametros(Request $request)
    {
        $novosParametros = $request->all();

        // Atualiza o arquivo parametros.csv
        $this->atualizarParametrosCsv('Ficheiros/Artigos/Parametros/parametros.csv', $novosParametros);

        // Atualiza o último arquivo unificado (ou cria um novo se não existir)
        $this->atualizarUnificadoCsv('Ficheiros/Artigos/Unificados', $novosParametros);

        return response()->json(['message' => 'Parâmetros salvos com sucesso.']);
    }

    /**
     * Atualiza o arquivo parametros.csv com os novos dados.
     */
    private function atualizarParametrosCsv(string $filePath, array $novosParametros)
    {
        $caminhoCompleto = storage_path($filePath);

        // Se o arquivo não existir, cria-o com um cabeçalho baseado nas chaves dos novos parâmetros
        if (!file_exists($caminhoCompleto)) {
            $this->criarArquivoCsv($caminhoCompleto, array_keys($novosParametros));
        }

        // Lê os dados existentes
        $dadosExistentes = $this->lerCsv($caminhoCompleto);

        // Atualiza ou adiciona os novos parâmetros (comparando apenas pelo 'id')
        $dadosAtualizados = $this->atualizarDados($dadosExistentes, $novosParametros);

        // Regrava os dados atualizados no arquivo
        $this->escreverCsv($caminhoCompleto, $dadosAtualizados);
    }

    /**
     * Atualiza o último arquivo unificado com os novos dados.
     */
    private function atualizarUnificadoCsv($directory, array $novosParametros)
    {
        // Obtém o arquivo unificado mais recente
        $arquivoMaisRecente = $this->getArquivoMaisRecente($directory);

        if (!$arquivoMaisRecente) {
            throw new \Exception("Nenhum arquivo unificado encontrado em: $directory");
        }

        // Lê os dados do arquivo unificado mais recente
        $dadosExistentes = $this->lerCsv($arquivoMaisRecente);

        // Atualiza ou adiciona os novos parâmetros
        $dadosAtualizados = $this->atualizarDados($dadosExistentes, $novosParametros);

        // Escreve os dados atualizados no arquivo unificado mais recente
        $this->escreverCsv($arquivoMaisRecente, $dadosAtualizados);

    }

    private function atualizarDados(array $dadosExistentes, array $novosDados): array
    {
        $atualizado = false;
        // Supondo que a primeira linha do CSV (o cabeçalho) já foi lida e temos as chaves originais:
        if (!empty($dadosExistentes)) {
            $headerKeys = array_keys(reset($dadosExistentes));
        } else {
            // Se não houver dados, considere as chaves dos novos dados como cabeçalho
            $headerKeys = array_keys($novosDados);
        }

        foreach ($dadosExistentes as &$linha) {
            if (strtolower(trim($linha['id'])) === strtolower(trim($novosDados['id']))) {
                // Faz o merge e depois filtra somente as chaves do cabeçalho
                $linha = array_merge($linha, $novosDados);
                $linha = array_intersect_key($linha, array_flip($headerKeys));
                $atualizado = true;
                break;
            }
        }

        if (!$atualizado) {
            // Se não encontrar o registro, antes de adicionar, filtra o novo registro para ter as mesmas chaves
            $novosDados = array_intersect_key($novosDados, array_flip($headerKeys));
            $dadosExistentes[] = $novosDados;
        }

        return $dadosExistentes;
    }



    /**
     * Lê um arquivo CSV e retorna os dados como um array associativo.
     */
    private function lerCsv(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [];
        }

        $fileHandle = fopen($filePath, 'r');
        $dados = [];
        $header = null;

        while (($linha = fgetcsv($fileHandle)) !== false) {
            if (!$header) {
                $header = array_map('trim', $linha);
            } else {
                // Se a linha tiver menos campos, preenche com valores padrão
                if (count($linha) < count($header)) {
                    $linha = array_pad($linha, count($header), 'N/A');
                }
                if (count($linha) === count($header)) {
                    $dados[] = array_combine($header, $linha);
                }
            }
        }

        fclose($fileHandle);
        return $dados;
    }

    /**
     * Escreve dados em um arquivo CSV.
     */
    private function escreverCsv(string $filePath, array $data): void
    {
        $fileHandle = fopen($filePath, 'w');

        if (!empty($data)) {
            // Escreve o cabeçalho
            fputcsv($fileHandle, array_keys(reset($data)));

            // Escreve cada linha de dados
            foreach ($data as $linha) {
                fputcsv($fileHandle, $linha);
            }
        }

        fclose($fileHandle);
    }

    /**
     * Cria um arquivo CSV vazio com um cabeçalho inicial.
     */
    private function criarArquivoCsv(string $filePath, array $header): void
    {
        $fileHandle = fopen($filePath, 'w');
        fputcsv($fileHandle, $header);
        fclose($fileHandle);
    }

    /**
     * Retorna o arquivo mais recente dentro do diretório especificado.
     */
    private function getArquivoMaisRecente(string $directory): ?string
    {
        $caminhoPasta = storage_path($directory);

        if (!is_dir($caminhoPasta)) {
            Log::error("Diretório não encontrado: {$caminhoPasta}");
            return null;
        }

        $arquivos = File::files($caminhoPasta);

        if (empty($arquivos)) {
            return null;
        }

        // Ordena os arquivos pela data extraída do nome (do mais recente para o mais antigo)
        usort($arquivos, function ($a, $b) {
            $dataA = $this->extractDateFromFilename($a->getFilename());
            $dataB = $this->extractDateFromFilename($b->getFilename());
            return $dataB <=> $dataA;
        });

        return $arquivos[0]->getPathname();
    }

    /**
     * Extrai a data do nome do arquivo no formato "YYYY-MM-DD".
     */
    private function extractDateFromFilename(string $filename): int
    {
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $filename, $matches)) {
            return strtotime($matches[1]) ?: 0;
        }
        return 0;
    }
}
