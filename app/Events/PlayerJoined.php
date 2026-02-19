<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoined implements ShouldBroadcast
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
    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->game->id),
        ];
    }
    /**
     * The event name on the client side.
     */
    public function broadcastAs(): string
    {
        // Event name WITHOUT dots - matches Game.jsx listener: .listen('PlayerJoined')
        return 'PlayerJoined';
    }

    /**
     * What data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'game' => $this->game->toBroadcastArray(),
        ];
    }
}
