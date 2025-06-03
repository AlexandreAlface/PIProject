<?php

namespace Database\Seeders;

use App\Models\Orcid;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class OrcidSeeder extends Seeder
{
    public function run()
    {
        $filePath = storage_path('Ficheiros/Investigadores/Investigadores-' . date('Y-m-d') . '.csv');

        if (!File::exists($filePath)) {
            \Log::error("🚨 Arquivo CSV não encontrado: $filePath");
            return;
        }

        // 🔴 Garantir que a tabela seja realmente truncada
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;'); // Desativar foreign keys
        \DB::table('orcids')->truncate(); // Apagar todos os registros
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;'); // Reativar foreign keys

        $file = fopen($filePath, 'r');
        $header = ['name', 'number', 'orcid', 'departamento', 'coluna5', 'coluna6', 'coluna7'];
        $data = [];

        while (($row = fgetcsv($file)) !== false) {
            // Garantir que o número de colunas corresponda ao cabeçalho
            while (count($row) < count($header)) {
                $row[] = 'N/A';
            }

            $registro = array_combine($header, $row);

            // Apenas adicionar campos necessários
            $data[] = [
                'name' => $registro['name'] ?? 'N/A',
                'orcid' => $registro['orcid'] ?? 'N/A',
                'departamento' => $registro['departamento'] ?? 'N/A',
            ];
        }

        fclose($file);

        // Inserir os novos dados na tabela
        foreach ($data as $entry) {
            Orcid::updateOrCreate(
                ['name' => $entry['name']],
                [
                    'orcid' => $entry['orcid'],
                    'departamento' => $entry['departamento'],
                ]
            );
        }

        \Log::info("✅ Seeder executado com sucesso!");
    }

}
