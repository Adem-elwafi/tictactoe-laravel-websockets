<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Game;
use App\Models\GamePlayer;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        // Game 1: Fresh game (no moves yet)
        $game1 = Game::create([
            'room_code' => 'FRESH1',
            'board' => ['', '', '', '', '', '', '', '', ''],
            'current_turn' => 'X',
            'status' => 'playing',
        ]);

        GamePlayer::create([
            'game_id' => $game1->id,
            'session_id' => 'session_player_x_1',
            'symbol' => 'X',
            'is_host' => true,
        ]);

        GamePlayer::create([
            'game_id' => $game1->id,
            'session_id' => 'session_player_o_1',
            'symbol' => 'O',
            'is_host' => false,
        ]);

        // Game 2: Mid-game (X's turn)
        $game2 = Game::create([
            'room_code' => 'MIDGM2',
            'board' => ['X', 'O', '', '', 'X', '', '', '', 'O'],
            'current_turn' => 'X',
            'status' => 'playing',
        ]);

        GamePlayer::create([
            'game_id' => $game2->id,
            'session_id' => 'session_player_x_2',
            'symbol' => 'X',
            'is_host' => true,
        ]);

        GamePlayer::create([
            'game_id' => $game2->id,
            'session_id' => 'session_player_o_2',
            'symbol' => 'O',
            'is_host' => false,
        ]);

        // Game 3: X wins (diagonal)
        $game3 = Game::create([
            'room_code' => 'XWINS3',
            'board' => ['X', 'O', 'O', '', 'X', '', '', '', 'X'],
            'current_turn' => 'X',
            'status' => 'finished',
            'winner' => 'X',
        ]);

        GamePlayer::create([
            'game_id' => $game3->id,
            'session_id' => 'session_player_x_3',
            'symbol' => 'X',
            'is_host' => true,
        ]);

        GamePlayer::create([
            'game_id' => $game3->id,
            'session_id' => 'session_player_o_3',
            'symbol' => 'O',
            'is_host' => false,
        ]);

        // Game 4: Draw game (all filled, no winner)
        $game4 = Game::create([
            'room_code' => 'DRAW44',
            'board' => ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
            'current_turn' => 'X',
            'status' => 'finished',
            'winner' => 'draw',
        ]);

        GamePlayer::create([
            'game_id' => $game4->id,
            'session_id' => 'session_player_x_4',
            'symbol' => 'X',
            'is_host' => true,
        ]);

        GamePlayer::create([
            'game_id' => $game4->id,
            'session_id' => 'session_player_o_4',
            'symbol' => 'O',
            'is_host' => false,
        ]);

        // Game 5: Waiting for second player
        $game5 = Game::create([
            'room_code' => 'WAIT55',
            'board' => ['', '', '', '', '', '', '', '', ''],
            'current_turn' => 'X',
            'status' => 'waiting',
        ]);

        GamePlayer::create([
            'game_id' => $game5->id,
            'session_id' => 'session_player_x_5',
            'symbol' => 'X',
            'is_host' => true,
        ]);

        $this->command->info('✅ Created 5 test games with players');
    }
}