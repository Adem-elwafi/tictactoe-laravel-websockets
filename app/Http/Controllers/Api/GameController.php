<?php

namespace App\Http\Controllers\Api;

use App\Models\Game;
use App\Models\GamePlayer;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use App\Events\GameUpdated;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Events\GameStarted;
class GameController extends Controller
{
    /**
     * Create a new game
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
public function store(Request $request): \Illuminate\Http\JsonResponse
{
    DB::beginTransaction();
    
    try {
        // Generate unique room code
        $roomCode = Game::generateRoomCode();
        
        // Get or create session
        if (!session()->has('_token')) {
            session()->regenerate();
        }
        $sessionId = session()->getId();
        
        \Log::info('Creating game with session', ['session_id' => $sessionId]);
        
        // Create the game
        $game = Game::create([
            'room_code' => $roomCode,
            'board' => ['', '', '', '', '', '', '', '', ''],
            'current_turn' => 'X',
            'status' => 'waiting',
        ]);
        
        // Add creator as player X (host)
        $player = GamePlayer::create([
            'game_id' => $game->id,
            'session_id' => $sessionId,
            'symbol' => 'X',
            'is_host' => true,
        ]);
        
        // Load relationships
        $game->load('players');
        
        // Broadcast game started
        broadcast(new GameStarted($game))->toOthers();
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => 'Game created successfully',
            'data' => [
                'game' => [
                    'id' => $game->id,
                    'room_code' => $game->room_code,
                    'board' => $game->board,
                    'current_turn' => $game->current_turn,
                    'status' => $game->status,
                ],
                'player' => [
                    'session_id' => $player->session_id,
                    'symbol' => $player->symbol,
                    'is_host' => $player->is_host,
                ],
            ]
        ], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        
        \Log::error('Failed to create game: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to create game',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
}
        /**
     * Join an existing game
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function join(Request $request) : \Illuminate\Http\JsonResponse 
    {
        // Only validate room_code - get session_id from server
        $validated = $request->validate([
            'room_code' => 'required|string|max:8', // Changed from size:7
        ]);

        // Get session ID from Laravel session (server-side)
        $sessionId = session()->getId();

        DB::beginTransaction();
        
        try {
            // Find the game by room code
            $game = Game::where('room_code', $validated['room_code'])->first();

            if (!$game) {
                return response()->json([
                    'success' => false,
                    'message' => 'Game not found. Check the room code.'
                ], 404);
            }

            // Check if game is joinable
            if ($game->status !== 'waiting') {
                return response()->json([
                    'success' => false,
                    'message' => 'Game is not accepting new players. Status: ' . $game->status
                ], 400);
            }

            // Check if player is already in this game
            $existingPlayer = GamePlayer::where('game_id', $game->id)
                ->where('session_id', $sessionId)  // ← Use server session
                ->first();

            if ($existingPlayer) {
                return response()->json([
                    'success' => true,  // Changed to true - not an error
                    'message' => 'You are already in this game.',
                    'redirect_to_game' => true,  // Flag for frontend
                    'data' => [
                        'game' => [
                            'id' => $game->id,
                            'board' => $game->board,
                            'current_turn' => $game->current_turn,
                            'status' => $game->status,
                            'winner' => $game->winner,
                        ],
                        'your_symbol' => $existingPlayer->symbol
                    ]
                ], 200);
            }

            // Count current players
            $playerCount = GamePlayer::where('game_id', $game->id)->count();

            if ($playerCount >= 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Game is already full (2 players).'
                ], 400);
            }

            // Assign symbol (second player gets 'O')
            $symbol = 'O';

            // Create the second player
            $player = GamePlayer::create([
                'game_id' => $game->id,
                'session_id' => $sessionId,  // ← Use server session
                'symbol' => $symbol,
                'is_host' => false,
            ]);

            // Update game status to 'playing'
            $game->update([
                'status' => 'playing'
            ]);

            // Refresh the game with players relationship
            $game->load('players');

            // Broadcast (fixed the syntax)
            broadcast(new GameUpdated($game))->toOthers();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully joined the game as Player ' . $symbol,
                'data' => [
                    'room_code' => $game->room_code,
                    'game' => [
                        'id' => $game->id,
                        'board' => $game->board,
                        'current_turn' => $game->current_turn,
                        'status' => $game->status,
                        'winner' => $game->winner,
                    ],
                    'player' => [
                        'session_id' => $player->session_id,
                        'symbol' => $player->symbol,
                        'is_host' => $player->is_host,
                    ],
                    'players' => $game->players->map(function ($player) {
                        return [
                            'session_id' => $player->session_id,
                            'symbol' => $player->symbol,
                            'is_host' => $player->is_host,
                        ];
                    })
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Join game error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to join game',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

        /**
     * Get current game state
     *
     * @param  string  $room_code
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $room_code): \Illuminate\http\JsonResponse
    {
        try {
            // Find the game by room code with its players
            $game = Game::where('room_code', $room_code)
                ->with('players') // Eager load players
                ->first();

            if (!$game) {
                return response()->json([
                    'success' => false,
                    'message' => 'Game not found. Check the room code.'
                ], 404);
            }

            // Format the players data
            $players = $game->players->map(function ($player) {
                return [
                    'session_id' => $player->session_id,
                    'symbol' => $player->symbol,
                    'is_host' => $player->is_host,
                    'joined_at' => $player->created_at,
                ];
            });

            // Calculate game statistics
            $playerCount = $game->players->count();
            $isWaiting = $game->status === 'waiting';
            $isPlaying = $game->status === 'playing';
            $isFinished = $game->status === 'finished';

            return response()->json([
                'success' => true,
                'message' => 'Game state retrieved successfully',
                'data' => [
                    'room_code' => $game->room_code,
                    'game' => [
                        'id' => $game->id,
                        'board' => $game->board,
                        'current_turn' => $game->current_turn,
                        'status' => $game->status,
                        'winner' => $game->winner,
                        'created_at' => $game->created_at,
                        'updated_at' => $game->updated_at,
                    ],
                    'players' => $players,
                    'statistics' => [
                        'player_count' => $playerCount,
                        'is_waiting' => $isWaiting,
                        'is_playing' => $isPlaying,
                        'is_finished' => $isFinished,
                        'can_join' => $isWaiting && $playerCount < 2,
                        'is_full' => $playerCount >= 2,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve game state',
                'error' => $e->getMessage()
            ], 500);
        }
    }
public function move(Request $request, Game $game)
{
    $validated = $request->validate([
        'position' => 'required|integer|min:0|max:8',
    ]);

    $position = $validated['position'];
    
    // Get current player from session (not user ID)
    $sessionId = session()->getId();
    
    // Find this player in the game
    $player = $game->players()->where('session_id', $sessionId)->first();
    
    if (!$player) {
        return response()->json(['message' => 'You are not in this game'], 403);
    }
    
    // Check if it's this player's turn
    if ($game->current_turn !== $player->symbol) {
        return response()->json(['message' => 'Not your turn'], 403);
    }
    
    // Check if cell is empty
    $board = $game->board;
    
    // Debug log
    
    if ($board[$position] !== '' && $board[$position] !== null) {
        return response()->json(['message' => 'Cell already occupied'], 422);
    }
    
    // Make the move
    $board[$position] = $player->symbol;
    $game->board = $board;
    
    // Switch turn
    $game->current_turn = $player->symbol === 'X' ? 'O' : 'X';
    
    // Check if game is still waiting (should be playing now)
    if ($game->status === 'waiting') {
        $game->status = 'playing';
    }
    
    $game->save();
    
    // Broadcast the update
    broadcast(new \App\Events\GameUpdated($game))->toOthers();
    
    return response()->json([
        'message' => 'Move made successfully',
        'game' => $game->fresh()->load('players')
    ]);
}
    public function room(string $room_code)
{
    $game = Game::where('room_code', $room_code)
        ->with('players')
        ->firstOrFail();

    return Inertia::render('Game', [
        'room_code' => $game->room_code,
        'initialGame' => $game->toBroadcastArray(),
    ]);
}
}