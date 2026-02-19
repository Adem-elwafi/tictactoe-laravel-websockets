<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Game extends Model //automatically  looks for games  table (plural,lowercase)
{
    use HasFactory;

    protected $fillable = [
        'room_code', 'board', 'current_turn', 'status', 'winner'
    ];

    protected $casts = [
        'board' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'winning_line' => 'array',
    ];

    public function players()
    {
        return $this->hasMany(GamePlayer::class);
    }

    // Helper: generate unique room code (6-8 chars, alphanumeric uppercase)
    public static function generateRoomCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (self::where('room_code', $code)->exists());

        return $code;
    }
    public function toBroadcastArray(): array
    {
        // Make sure players are loaded
        $this->loadMissing('players');

        return [
            'id' => $this->id,
            'room_code' => $this->room_code,
            'board' => $this->board,
            'current_turn' => $this->current_turn,
            'status' => $this->status,
            'winner' => $this->winner,
            'winning_line' => $this->winning_line, 
            'players' => $this->players->map(fn ($player) => [
                'session_id' => $player->session_id,
                'symbol' => $player->symbol,
                'is_host' => (bool) $player->is_host,  // ← Cast to boolean
            ])->values()->toArray(),  // ← Convert to plain array!
        ];
    }
    /**
 * Check the board for a winner or draw.
 *
 * Returns an array with:
 *   'status'       => 'playing' | 'finished'
 *   'winner'       => null | 'X' | 'O' | 'draw'
 *   'winning_line' => null | [int, int, int]  ← flat board indices
 */
    public function checkGameResult(array $board): array
    {
        // All 8 possible winning lines (flat 0-8 indices)
        $lines = [
            [0, 1, 2], // top row
            [3, 4, 5], // middle row
            [6, 7, 8], // bottom row
            [0, 3, 6], // left col
            [1, 4, 7], // center col
            [2, 5, 8], // right col
            [0, 4, 8], // diagonal top-left → bottom-right
            [2, 4, 6], // diagonal top-right → bottom-left
        ];

        foreach ($lines as [$a, $b, $c]) {
            // A line is a win if all three cells are the same non-empty value
            if (
                $board[$a] !== '' &&
                $board[$a] === $board[$b] &&
                $board[$b] === $board[$c]
            ) {
                return [
                    'status'       => 'finished',
                    'winner'       => $board[$a], // 'X' or 'O'
                    'winning_line' => [$a, $b, $c],
                ];
            }
        }

        // No winner — is the board full? (no empty strings left)
        $isDraw = !in_array('', $board, strict: true);

        if ($isDraw) {
            return [
                'status'       => 'finished',
                'winner'       => 'draw',
                'winning_line' => null,
            ];
        }

        // Game continues
        return [
            'status'       => 'playing',
            'winner'       => null,
            'winning_line' => null,
        ];
    }
}