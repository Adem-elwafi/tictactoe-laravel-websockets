<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GameController;
use inertia\Inertia;
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
Route::middleware('web')->group(function () {
    // Game creation endpoint
    Route::post('/games', [GameController::class, 'store']);
    
    // Join game endpoint
    Route::post('/games/join', [GameController::class, 'join']);
    
    // Get game state endpoint
    Route::get('/games/{room_code}', [GameController::class, 'show']);
    
    // Make move endpoint
    Route::post('/games/{game}/move', [GameController::class, 'move']);

    Route::post('/games/{game}/reset', [GameController::class, 'reset']);

});

// Show the join form
Route::get('/games/join', function () {
    return Inertia::render('JoinGame');
})->middleware('auth');
