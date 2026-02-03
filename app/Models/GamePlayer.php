<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GamePlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id', 'session_id', 'symbol', 'is_host'
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}