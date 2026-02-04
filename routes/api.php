<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GameController;

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

Route::middleware('api')->group(function () {
    // Game creation endpoint
    Route::post('/games', [GameController::class, 'store']);
    
    // Note: We'll add join and show endpoints in later sub-steps
    // Route::post('/games/join', [GameController::class, 'join']);
    // Route::get('/games/{room_code}', [GameController::class, 'show']);
});