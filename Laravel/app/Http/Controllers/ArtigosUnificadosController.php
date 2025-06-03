<?php

namespace App\Http\Controllers;

use App\Services\ArtigosServices\ArtigosUnificadosService;
use App\Services\ArtigosServices\EditarArtigosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

class ArtigosUnificadosController extends Controller
{
    private $artigosUnificadosService;
    private $editarArtigosService;

    public function __construct(ArtigosUnificadosService $uniService, EditarArtigosService $editArtigos)
    {
        $this->artigosUnificadosService = $uniService;

        $this->editarArtigosService  = $editArtigos;

    }

    public function downloadArtigos()
    {
        $ficheirorecente = $this->artigosUnificadosService->ficheiroMaisRecente();

        if (!$ficheirorecente) {
            return response()->json(['error' => 'Nenhum arquivo encontrado na pasta de artigos unificados.'], 404);
        }

        return Response::download($ficheirorecente, 'ArtigosUnificados.csv', ['Content-Type' => 'text/csv']);
    }

    public function getArtigos(){

        return $this->artigosUnificadosService->getArtigos();
    }


    public function getArtigosWBS(){
        return $this->artigosUnificadosService->getArtigosWBS();
    }

    public function getArtigosScopus(){
        return $this->artigosUnificadosService -> getArtigosScopus();
    }


    public function getArtigosQuantidade($dataI,$dataF){
        $artigos = $this->artigosUnificadosService -> getArtigosQuantidade($dataI,$dataF);
        return $artigos;
    }

    public function data(){
        $caminhoPasta = storage_path('Ficheiros/Artigos/Unificados');
        $artigos = File::files($caminhoPasta);
        $maisRecente = last($artigos);

        $padrao = '/(\d{4}-\d{2}-\d{2})/';

        preg_match($padrao,  $maisRecente, $correspondencias);

        $ano = $correspondencias[1];

        $partes = explode('-', $ano);

        $data = $partes[2] . '/' . $partes[1] . '/' . $partes[0];

        return [$data];
    }

    //Unificar Arquivos

    /**
     * @throws \Exception
     */
    public function Unificar(Request $request){
        if($request[0] == 1){
            return $this->artigosUnificadosService->unificarArtigos();
        }
        return ["Sem Permissão"];
    }

    public function saveNovosParametros(Request $request)
    {
        return $this->editarArtigosService->saveNovosParametros($request);

    }

}
