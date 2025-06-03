<?php

namespace App\Http\Controllers;

use App\Services\ArtigosServices\ArtigosWOSService;
use Illuminate\Http\Request;

class ArtigosWOSController extends Controller
{
    private $wosService;


    public function __construct(ArtigosWOSService $wosService)
    {
        $this->wosService = $wosService;
    }

    public function postArtigosWBS(Request $request){

        if($request[0] == 1){
            return $this->wosService->getArtigosWOS();
        }
        return ["algo mal"];
    }
}
