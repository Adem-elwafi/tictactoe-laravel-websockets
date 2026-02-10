<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports.
|
*/

Broadcast::channel('game.{room_code}', function ($user = null, string $room_code) {
    // Allow subscription if the game exists.
    // $user is null because we are using session-based / anonymous auth.
    return Game::where('room_code', $room_code)->exists();
    
    
});
