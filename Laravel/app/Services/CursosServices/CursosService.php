<?php

namespace App\Services\CursosServices;
use Illuminate\Support\Facades\File;

class CursosService
{
    public function ficheiroMaisRecente()
    {
        $caminhoPasta = storage_path('Ficheiros/Cursos/');
        return last(File::files($caminhoPasta));
    }

    function saveCursos($request)
    {
        if (!$request->hasFile('file')) {
            return ["Erro" => "Nenhum arquivo enviado."];
        }
        try {
            $file = $request->file('file');
            $filePath = storage_path('Ficheiros/Cursos/Cursos-' . date('Y-m-d-H-i-s') . '.csv');

            // 📌 Mover o arquivo original para a pasta de cursos
            $file->move(storage_path('Ficheiros/Cursos'), basename($filePath));

        return ["Sucesso" => "Arquivo processado e salvo com sucesso!"];
        } catch (\Exception $e) {
            \Log::error("Erro ao salvar o arquivo de cursos: " . $e->getMessage());
            return ["Erro" => "Erro ao salvar o arquivo de cursos."];
        }
    }

    function getCursosByFile($ficheiro)
        {
            $dadosCursos = [];
            $file = fopen($ficheiro, 'r');

            while (($linha = fgetcsv($file)) !== false) {
                array_push($dadosCursos, $linha);
            }
            fclose($file);
            return $dadosCursos;
        }

    function getCursos()
    {
        // Define a pasta onde estão os arquivos de cursos
        $caminhoPasta = storage_path('Ficheiros/Cursos');

        // Verifica se a pasta existe
        if (!is_dir($caminhoPasta)) {
            return response()->json([], 404);
        }

        // Obtém todos os arquivos da pasta usando o File facade
        $arquivos = \Illuminate\Support\Facades\File::files($caminhoPasta);

        // Se não houver arquivos, retorna 404
        if (empty($arquivos)) {
            return response()->json([], 404);
        }

        // Ordena os arquivos pela data de criação (do mais recente para o mais antigo)
        usort($arquivos, function ($a, $b) {
            return $b->getCTime() <=> $a->getCTime();
        });

        // Pega o caminho do arquivo mais recente
        $arquivoMaisRecente = $arquivos[0]->getPathname();

        // Verifica se o arquivo realmente existe
        if (!file_exists($arquivoMaisRecente)) {
            return response()->json([], 404);
        }

        // Abre o arquivo para leitura
        $file = fopen($arquivoMaisRecente, 'r');
        $cursos = [];

        // Lê o cabeçalho (supondo que o CSV possua cabeçalho)
        $header = fgetcsv($file);

        // Lê cada linha do CSV
        while (($linha = fgetcsv($file)) !== false) {
            // Supondo que a estrutura seja:
            // [0] => Código, [1] => Nome, [2] => Ciclo, [3] => Escola, [4...] => CNAEF
            $codigo = trim($linha[0]);
            $nome = trim($linha[1]);
            $ciclo = trim($linha[2]);
            $escola = trim($linha[3]);

            // Pega os CNAEF a partir da coluna 4 e filtra as colunas vazias
            $cnaefs = array_slice($linha, 4);
            $cnaefs = array_filter(array_map('trim', $cnaefs), function ($valor) {
                return $valor !== '';
            });

            $cursos[] = [
                'codigo' => $codigo,
                'nome' => $nome,
                'ciclo' => $ciclo,
                'escola' => $escola,
                'cnaefs' => array_values($cnaefs) // reindexa o array
            ];
        }

        fclose($file);
        return response()->json($cursos);
    }

}
