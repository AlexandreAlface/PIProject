<?php

namespace App\Services\InvestigadoresServices;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use function Laravel\Prompts\error;

class InvestigadoresService
{
    Public function ficheiroMaisRecente()
    {
        $caminhoPasta = storage_path('Ficheiros/Investigadores/');
        return last(File::files($caminhoPasta));
    }

    public function cnaef(): array
    {
        $dadoscnaef = [];
        $caminhoPasta = storage_path('Ficheiros/CNAEF/cnaef.csv');
        $file = fopen($caminhoPasta, 'r');

        while (($linha = fgetcsv($file)) !== false) {
            array_push($dadoscnaef, $linha);
        }
        return $dadoscnaef;
    }

    function getAutor($id)
    {
        $dadosAutor = [];
        $file = fopen($this->ficheiroMaisRecente(), 'r');

        while (($linha = fgetcsv($file)) !== false) {
            if($linha [1] == $id){
                $dadosAutor = $linha;
            }
        }
        return $dadosAutor;
    }

    function getAutores()
    {
        $dadosAutores = [];
        $file = fopen($this->ficheiroMaisRecente(), 'r');

        while (($linha = fgetcsv($file)) !== false) {
            array_push($dadosAutores, $linha);
        }

        for($i = 0; $i < count($dadosAutores); $i++){
            if(count( $dadosAutores[$i]) > 4){
                if( $dadosAutores[$i][4] == "" || $dadosAutores[$i][4] == "0" ){
                    $dadosAutores[$i][4] = "N/A";
                }

                if( $dadosAutores[$i][5] == "" || $dadosAutores[$i][5] == "0"){
                    $dadosAutores[$i][5] = "N/A";
                }

                if( $dadosAutores[$i][6] == "" || $dadosAutores[$i][6] == "0" ){
                    $dadosAutores[$i][6] = "N/A";
                }
            }
        }
        return $dadosAutores;
    }

    function saveAutores($investigadores)
    {
        $autores = collect($investigadores);
        $autores->shift();
        $caminho = storage_path('Ficheiros/Investigadores/Investigadores-'. date('Y-m-d') .'.csv');

        $file = fopen($caminho, 'w');
        foreach ($autores as $row) {
            fputcsv($file, $row);
        }
        fclose($file);
        return ["Sucesso!"];
    }

    function getAutoresByFile($ficheiro)
    {
        $file = fopen($ficheiro, 'r');
        $dadosAutores = [];

        while (($linha = fgetcsv($file)) !== false) {
            array_push($dadosAutores,$linha);
        }
        fclose($file);
        return $dadosAutores;
    }

    public function getOrcids(): array
    {
        $orcids = [];
        $filePath = storage_path('Ficheiros/Investigadores/Investigadores-' . date('Y-m-d') . '.csv');

        if (!File::exists($filePath)) {
            \Log::error('Arquivo CSV de investigadores não encontrado.');
            return $orcids;
        }

        $file = fopen($filePath, 'r');
        $header = fgetcsv($file);

        // Processar cada linha do arquivo
        while (($row = fgetcsv($file)) !== false) {
            $orcids[] = array_combine($header, $row);
        }

        fclose($file);

        return $orcids;
    }


    public function refreshOrcidsTable()
    {
        // Trunca a tabela orcids
        DB::table('orcids')->truncate();

        // Roda o seeder novamente
        Artisan::call('db:seed', [
            '--class' => 'OrcidSeeder',
        ]);

        return "Tabela orcids atualizada com sucesso.";
    }

    public function updateInvestigadores(array $data): string
    {
        try {
            // Truncar a tabela antes de inserir novos dados
            DB::table('orcids')->truncate();

            // Salvar os dados processados para o Seeder
            $filePath = storage_path('Ficheiros/Investigadores/Investigadores-' . date('Y-m-d') . '.csv');
            $file = fopen($filePath, 'w');

            // Validar e processar os dados
            $filteredData = array_map(function ($row) {
                return [
                    'name' => trim($row['name'] ?? 'N/A'),
                    'orcid' => trim($row['orcid'] ?? 'N/A'),
                    'departamento' => trim($row['departamento'] ?? 'N/A'),
                ];
            }, $data);

            // Escrever cabeçalho
            if (!empty($filteredData)) {
                fputcsv($file, array_keys($filteredData[0]));
            }

            // Escrever os dados
            foreach ($filteredData as $row) {
                fputcsv($file, $row);
            }

            fclose($file);

            return "Dados dos investigadores processados e armazenados com sucesso.";
        } catch (\Exception $e) {
            \Log::error('Erro ao atualizar investigadores:', ['error' => $e->getMessage()]);
            return "Erro ao atualizar investigadores.";
        }
    }

    public function processarArquivoCSV($filePath): string
    {
        if (!File::exists($filePath)) {
            \Log::error("🚨 Arquivo CSV não encontrado: $filePath");
            return "Erro: Arquivo não encontrado.";
        }

        $file = fopen($filePath, 'r');

        // 🔹 Cabeçalhos esperados
        $header = ['name', 'number', 'orcid', 'departamento', 'coluna5', 'coluna6', 'coluna7'];
        $data = [];

        // 🔹 Processar todas as linhas do arquivo
        while (($row = fgetcsv($file)) !== false) {
            // Ignorar linhas vazias
            if (empty(array_filter($row))) {
                continue;
            }

            // Garantir que a linha tenha o número correto de colunas
            while (count($row) < count($header)) {
                $row[] = 'N/A'; // Preencher colunas ausentes com "N/A"
            }

            // Verificar se o número de colunas ainda não é suficiente
            if (count($row) !== count($header)) {
                fclose($file);
                return "Erro: O arquivo CSV contém linhas com colunas ausentes.";
            }

            // Associar os dados às colunas esperadas
            $registro = array_combine($header, $row);

            // Apenas capturar as colunas relevantes para a base de dados
            $data[] = [
                'name' => trim($registro['name'] ?? 'N/A'),
                'orcid' => trim($registro['orcid'] ?? 'N/A'),
                'departamento' => trim($registro['departamento'] ?? 'N/A'),
            ];
        }

        fclose($file);

        // 🔹 Verificar se há dados válidos
        if (empty($data)) {
            return "Erro: Nenhum dado válido encontrado no CSV.";
        }

        // 🔴 Garantir que a tabela seja truncada antes da nova inserção
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \DB::table('orcids')->truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Inserir os novos dados no banco de dados
        foreach ($data as $entry) {
            \App\Models\Orcid::updateOrCreate(
                ['name' => $entry['name']],
                [
                    'orcid' => $entry['orcid'],
                    'departamento' => $entry['departamento'],
                ]
            );
        }

        return "Arquivo processado e base de dados atualizada com sucesso.";
    }





}
