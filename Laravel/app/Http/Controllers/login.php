<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;


class login extends Controller
{
    public function login(Request $request)
    {
        // Validação dos dados recebidos
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        // Caso a validação falhe
        if ($validator->fails()) {
            return response()->json([
                'error' => 'Dados inválidos.',
                'messages' => $validator->errors()
            ], 422);
        }

        // Tentativa de login usando Auth::attempt
        $credentials = $request->only('email', 'password');
        if (Auth::attempt($credentials)) {
            // Recuperar o usuário autenticado
            $user = Auth::user();

            // Criar um token para o usuário
            $token = $user->createToken('AdminBEJA')->plainTextToken;

            // Retornar sucesso com o token gerado
            return response()->json([
                'message' => 'Login realizado com sucesso!',
                'user' => $user,
                'token' => $token
            ], 200);
        }

        // Caso as credenciais estejam erradas
        return response()->json([
            'error' => 'Email ou senha incorretos. Tente novamente!'
        ], 401);
    }


    public function logout(Request $request)
    {
        return ["Logout Com Sucesso!"];
    }



}


