<?php

namespace App\Http\Controllers;

use App\Services\HealthCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class StatusController extends Controller
{
    public function json(HealthCheck $health): JsonResponse
    {
        $result = $health->inspect();

        return new JsonResponse($result, $result['status'] === 'ok' ? 200 : 503, ['Cache-Control' => 'no-store']);
    }

    public function html(HealthCheck $health): Response
    {
        $result = $health->inspect();

        return new Response(view('status', ['result' => $result])->render(), $result['status'] === 'ok' ? 200 : 503, ['Cache-Control' => 'no-store']);
    }
}
