<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Events\TestEvent;
use App\Http\Controllers\Api\GameController;
use App\Models\Game; 

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});
//create game page route 
Route::get('/create-game', function () {
    return Inertia::render('CreateGame');
})->name('game.create');
//route  to the Game.jsx 
Route::get('/game/{game}', function (Game $game) {
    $game->load('players');
    
    return Inertia::render('Game', [
        'room_code' => $game->room_code,  // ← Separate prop
        'initialGame' => [
            'id' => $game->id,
            'room_code' => $game->room_code,  // Also include in game object
            'board' => $game->board,
            'current_turn' => $game->current_turn,
            'status' => $game->status,
            'winner' => $game->winner,
            'players' => $game->players->map(fn($p) => [
                'session_id' => $p->session_id,
                'symbol' => $p->symbol,
                'is_host' => $p->is_host,
            ])->toArray(),
        ]
    ]);
})->name('game.show');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// TEST EVENT
Route::get('/test-websocket', function () {
    broadcast(new TestEvent('Hello from Reverb!'));
    return 'Event broadcasted!';
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Game routes
Route::middleware(['auth'])->group(function () {
    // Show join form
    Route::get('/games/join', function () {
        return Inertia::render('JoinGame');
    })->name('games.join.form');
    
    // Game room page
    Route::get('/games/room/{room_code}', [GameController::class, 'room'])
        ->name('games.room');
});

require __DIR__.'/auth.php';