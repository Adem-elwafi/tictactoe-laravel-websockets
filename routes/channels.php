<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Public channel for games - accessible by game ID
// No authentication needed since we're using session-based players
Broadcast::channel('game.{id}', function ($user, $id) {
    // Allow anyone to access the game channel
    // In a real app you'd verify they are in the game
    return true;
});
