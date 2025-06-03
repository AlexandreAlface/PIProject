<?php

namespace App\Services\KeyService;

use App\Models\ApiKey;
use Illuminate\Support\Facades\Http;

class ApiKeyValidator
{
    public function checkElsevierKey()
    {

        $apiKey = ApiKey::where('service_name', 'Elsevier')->first()->api_key;

        $response = Http::withHeaders([
            'X-ELS-APIKey' => $apiKey,
        ])->get('https://api.elsevier.com/content/search/scopus', [
            'query' => 'AF-ID(60015758)',
            'count' => 1,
        ]);

        return $response->successful();
    }

    public function checkClarivateKey()
    {

        $apiKey = ApiKey::where('service_name', 'Clarivate')->first()->api_key;


        $response = Http::withHeaders([
            'X-ApiKey' => $apiKey,
        ])->get('https://api.clarivate.com/apis/wos-starter/v1/documents', [
            'q' => 'OG=(Instituto Politecnico de Beja)',
            'limit' => 1,
        ]);

        return $response->successful();
    }
}
