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
        // Make sure players are loaded (no DB write, just safety)
        $this->loadMissing('players');

        return [
            'id' => $this->id,
            'room_code' => $this->room_code,
            'board' => $this->board,
            'current_turn' => $this->current_turn,
            'status' => $this->status,
            'winner' => $this->winner,
            'players' => $this->players->map(fn ($player) => [
                'session_id' => $player->session_id,
                'symbol' => $player->symbol,
                'is_host' => $player->is_host,
            ])->values(),
        ];
    }
}