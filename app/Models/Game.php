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
}