<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public Game $game;

    /**
     * Create a new event instance.
     */
    public function __construct(Game $game)
    {
        $this->game = $game;
    }

    /**
     * The channel the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        // Private channel per game
        return new PrivateChannel('game.' . $this->game->room_code);
    }

    /**
     * The event name on the client side.
     */
    public function broadcastAs(): string
    {
        return 'game.updated';
    }

    /**
     * What data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Customize exactly what the client needs
        return [
            'id' => $this->game->id,
            'room_code' => $this->game->room_code,
            'board' => $this->game->board,
            'current_turn' => $this->game->current_turn,
            'status' => $this->game->status,
            'winner' => $this->game->winner,
            // optionally include players
            'players' => $this->game->players->map(fn($p) => [
                'session_id' => $p->session_id,
                'symbol' => $p->symbol,
                'is_host' => $p->is_host,
            ]),
        ];
    }
}
