<?php

namespace App\Http\Controllers\Api;

use App\Models\Game;
use App\Models\GamePlayer;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

class GameController extends Controller
{
    /**
     * Create a new game
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // For anonymous play, we need to generate or use a session_id
        // If not provided in request, use Laravel's session ID
        $sessionId = $request->input('session_id') ?? Session::getId();
        
        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'Session ID is required for anonymous play'
            ], 400);
        }

        DB::beginTransaction();
        
        try {
            // Generate room code using the method from your Game model
            $roomCode = Game::generateRoomCode();

            // Create the game - note your board is 2D array, not flat
            $game = Game::create([
                'room_code' => $roomCode,
                'board' => [['', '', ''], ['', '', ''], ['', '', '']],
                'current_turn' => 'X',
                'status' => 'waiting',
                'winner' => null,
            ]);

            // Create the host player (always X)
            $player = GamePlayer::create([
                'game_id' => $game->id,
                'session_id' => $sessionId,
                'symbol' => 'X',
                'is_host' => true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Game created successfully',
                'data' => [
                    'room_code' => $game->room_code,
                    'game' => [
                        'id' => $game->id,
                        'board' => $game->board,
                        'current_turn' => $game->current_turn,
                        'status' => $game->status,
                        'winner' => $game->winner,
                        'created_at' => $game->created_at,
                    ],
                    'player' => [
                        'session_id' => $player->session_id,
                        'symbol' => $player->symbol,
                        'is_host' => $player->is_host,
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create game',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}