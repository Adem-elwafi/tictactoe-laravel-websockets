<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('game.{room_code}', function ($user, $room_code) {
    // Find the game by room_code
    $game = Game::where('room_code', $room_code)->first();
    
    // Allow if game exists
    return $game !== null;
});
