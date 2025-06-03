<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    // Listar todas as chaves de API
    public function index()
    {

        $apiKeys = ApiKey::all();
        return response()->json($apiKeys);
    }

    // Criar uma nova chave de API
    public function store(Request $request)
    {
        $request->validate([
            'service_name' => 'required|string|max:255',
            'api_key' => 'required|string|max:255',
        ]);

        $apiKey = ApiKey::create($request->all());
        return response()->json($apiKey, 201);
    }

    // Mostrar uma chave de API específica
    public function show($id)
    {
        $apiKey = ApiKey::findOrFail($id);
        return response()->json($apiKey);
    }

    // Atualizar uma chave de API existente
    public function update(Request $request, $id)
    {
        $request->validate([
            'service_name' => 'sometimes|required|string|max:255',
            'api_key' => 'sometimes|required|string|max:255',
        ]);

        $apiKey = ApiKey::findOrFail($id);
        $apiKey->update($request->all());
        return response()->json($apiKey);
    }

    // Excluir uma chave de API
    public function destroy($id)
    {
        $apiKey = ApiKey::findOrFail($id);
        $apiKey->delete();
        return response()->json(null, 204);
    }
}
