<?php

namespace App\Http\Controllers;

use App\Services\InvestigadoresServices\InvestigadoresService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;
use function Laravel\Prompts\error;
use Illuminate\Support\Facades\Artisan;

class investigadores extends Controller
{

    private $investigadoresService;

    public function __construct(InvestigadoresService $investigadoresService)
    {
        $this->investigadoresService = $investigadoresService;

    }
    public function getAutores()
    {

        return $this->investigadoresService->getAutores();
    }

    public function getAutor($id)
    {

        return $this->investigadoresService->getAutor($id);
    }

    public function postAutores(Request $request)
    {
        try {
            // Verificar se um arquivo foi enviado
            if (!$request->hasFile('file')) {
                return response()->json(['message' => 'Nenhum arquivo enviado.'], 400);
            }

            $file = $request->file('file');
            $tempPath = storage_path('Ficheiros/Temp/' . $file->getClientOriginalName());
            $file->move(storage_path('Ficheiros/Temp'), basename($tempPath));

            // Processar os dados chamando o serviço corretamente
            $resultado = $this->investigadoresService->processarArquivoCSV($tempPath);

            if (str_contains($resultado, "Erro")) {
                unlink($tempPath); // 🔥 Remover arquivo se inválido
                return response()->json(['message' => $resultado], 400);
            }

            $originalPath = storage_path('Ficheiros/Investigadores/Investigadores-' . date('Y-m-d-H-i-s') . '.csv');
            rename($tempPath, $originalPath); // Mover arquivo validado

            return response()->json(['message' => $resultado], 200);
        } catch (\Exception $e) {
            \Log::error("Erro ao processar arquivo CSV: " . $e->getMessage());
            return response()->json(['message' => 'Erro ao processar o arquivo CSV.'], 500);
        }
    }

    public function downloadAutores($url)
    {
        // Verificar se o arquivo existe
        if (!file_exists(storage_path('Ficheiros/Investigadores/' . $url))) {
            return response()->json(['error' => 'Arquivo não encontrado'], 404);
        }
        return Response::download(storage_path('Ficheiros/Investigadores/' . $url), 'investigadores.csv', ['Content-Type' => 'text/csv']);
    }

    public function deleteAutores($url){
        unlink(storage_path('Ficheiros/Investigadores/' . $url));
        return ["Eliminado Com Sucesso"];
    }

    public function cnaef(){

        return $this->ivestigadoresService->cnaef();
    }

    public function ficheirosAutores(){
        $nomes = [];
        $arquivos = File::allFiles(storage_path('Ficheiros/Investigadores'));

        foreach ($arquivos as $arquivo) {
            $nome = $arquivo->getFilename();
            array_push($nomes, $nome);
        }
        return array_reverse($nomes);
    }
}
