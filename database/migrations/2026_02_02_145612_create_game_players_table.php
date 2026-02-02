<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('session_id');                       // Laravel session()->getId() or similar
            $table->string('symbol');                           // 'X' or 'O'
            $table->boolean('is_host')->default(false);         // first player = host
            $table->timestamps();

            $table->unique(['game_id', 'session_id']);          // one player per session per game
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_players');
    }
};