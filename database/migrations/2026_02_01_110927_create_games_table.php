<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('room_code', 8)->unique();           // e.g. ABC123DE – short & unique
            $table->json('board')->default(json_encode([
                '', '', '', '', '', '', '', '', ''
            ]));  // 3x3 array, '' = empty, 'X' or 'O'
            $table->string('current_turn')->default('X');       // 'X' or 'O'
            $table->string('status')->default('waiting');       // waiting | playing | finished
            $table->string('winner')->nullable();               // 'X' | 'O' | 'draw' | null
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};