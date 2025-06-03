<?php

use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\ArtigosScopusController;
use App\Http\Controllers\ArtigosUnificadosController;
use App\Http\Controllers\ArtigosWOSController;
use App\Http\Controllers\CursosController;
use App\Http\Controllers\investigadores;
use App\Http\Controllers\login;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('api-keys', ApiKeyController::class);
Route::middleware('auth:sanctum')->apiResource('api-keys', ApiKeyController::class);


#Login Admin
Route::post('/login', [login::class, 'login']);
Route::post('/logout', [login::class, 'logout']);

# Rotas para os ArtigosScopusService
Route::get('/artigos',[ArtigosUnificadosController::class,'getArtigos']);
Route::middleware('auth:sanctum')->post('/artigos/add/Scopus',[ArtigosScopusController::class,'postArtigosScopus']);
Route::middleware('auth:sanctum')->post('/artigos/add/WBS',[ArtigosWOSController::class,'postArtigosWBS']);
Route::middleware('auth:sanctum')->post('/artigos/add/Unificar',[ArtigosUnificadosController::class,'Unificar']);
Route::get('/artigos/get/WBS',[ArtigosUnificadosController::class,'getArtigosWBS']);
Route::get('/artigos/get/Scopus',[ArtigosUnificadosController::class,'getArtigosScopus']);
Route::get('/artigos/unificados', [ArtigosUnificadosController::class, 'downloadArtigos']);
Route::middleware('auth:sanctum')->post('/artigos/add/parametros',[ArtigosUnificadosController::class,'saveNovosParametros']);

Route::get('/artigos/quantidade/{dataI}/{dataF}/{deaprtamento}/{curso}',[ArtigosUnificadosController::class,'getArtigosQuantidade']);
Route::get('/artigos/download',[ArtigosUnificadosController::class,'download']);

Route::get('/artigos/data',[ArtigosUnificadosController::class,'data']);


# Rotas para os Cursos
Route::get('/Cursos',[CursosController::class,'getCursos']);
#Route::get('/curso/{id}',[cursos::class,'getCurso']);
Route::middleware('auth:sanctum')->post('/Cursos/add',[CursosController::class,'postCursos']);
Route::get('/Cursos/ficheiros',[CursosController::class,'ficheirosCursos']);
Route::get('/Cursos/download/{id}',[CursosController::class,'downloadCursos']);
Route::delete('/Cursos/delete/{id}',[CursosController::class,'deleteCursos']);


# Rotas para os Autores
Route::get('/Autores',[investigadores::class,'getAutores']);
#Route::get('/autor/{id}',[investigadores::class,'getAutor']);
Route::middleware('auth:sanctum')->post('/Autores/add',[investigadores::class,'postAutores']);
Route::get('/Autores/ficheiros',[investigadores::class,'ficheirosAutores']);
Route::get('/Autores/download/{id}',[investigadores::class,'downloadAutores']);
Route::delete('/Autores/delete/{id}',[investigadores::class,'deleteAutores']);
Route::get('/cnaef',[investigadores::class,'cnaef']);
