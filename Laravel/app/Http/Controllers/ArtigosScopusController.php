<?php

namespace App\Http\Controllers;

use App\Services\ArtigosServices\ArtigosScopusService;
use Illuminate\Http\Request;

class ArtigosScopusController extends Controller
{
    private $scopusService;

    public function __construct(ArtigosScopusService $scopusService)
    {
        $this->scopusService = $scopusService;

    }

    public function postArtigosScopus(Request $request) {

        if ($request[0] == 1) {
            return $this->scopusService->getArtigosScopus();
        }

        return ["algo mal"];
    }
}
