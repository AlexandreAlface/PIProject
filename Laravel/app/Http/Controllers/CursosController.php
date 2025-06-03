<?php

namespace App\Http\Controllers;

use App\Services\CursosServices\CursosService;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;


class CursosController extends Controller
{

    private CursosService $cursosService;

    public function __construct(CursosService $cursoService)
    {
        $this->cursosService = $cursoService;

    }

    public function getCursos()
    {
        return $this->cursosService->getCursos();
    }


    public function getCurso($id)
    {
        return $this->cursosService->getCurso($id);
    }


    public function postCursos(Request $request)
    {
        $resultado = $this->cursosService->saveCursos($request);

        // 📌 Retornar resposta JSON correta
        if (isset($resultado['Erro'])) {
            return response()->json(['message' => $resultado['Erro']], 400);
        }

        return response()->json(['message' => $resultado['Sucesso']], 200);
    }


    public function downloadCursos($url)
    {
        // Verificar se o arquivo existe
        if (!file_exists(storage_path('Ficheiros/Cursos/' . $url))) {
            return response()->json(['error' => 'Arquivo não encontrado'], 404);
        }
        return Response::download(storage_path('Ficheiros/Cursos/' . $url), 'cursos.csv', ['Content-Type' => 'text/csv']);
    }

    public function deleteCursos($url)
    {
        unlink(storage_path('Ficheiros/Cursos/' . $url));
        return ["Eliminado Com Sucesso"];
    }


    public function ficheirosCursos()
    {
        $nomes = [];

        $arquivos = File::allFiles(storage_path('Ficheiros/Cursos'));

        foreach ($arquivos as $arquivo) {
            $nome = $arquivo->getFilename();
            array_push($nomes, $nome);
        }
        return array_reverse($nomes);
    }
}



