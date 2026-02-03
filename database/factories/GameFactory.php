<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Game;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Game>
 */
class GameFactory extends Factory
{
    protected $model = Game::class;

    public function definition(): array
    {
        return [
            'room_code' => Game::generateRoomCode(),
            'board' => [['', '', ''], ['', '', ''], ['', '', '']],
            'current_turn' => 'X',
            'status' => 'waiting',
        ];
    }
}