<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Events\TestEvent;
use App\Http\Controllers\Api\GameController;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');
//TEST EVENT
Route::get('/test-websocket', function () {
    broadcast(new TestEvent('Hello from Reverb!'));
    return 'Event broadcasted!';
});
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

//Open the live game page 
Route::middleware(['auth'])->get(
    '/games/room/{room_code}',
    [GameController::class, 'room']
)->name('games.room');


Route::get('/games/{room_code}', [GameController::class, 'room'])
    ->name('games.room');


require __DIR__.'/auth.php';
