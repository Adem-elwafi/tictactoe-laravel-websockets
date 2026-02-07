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
        return $this->game->toBroadcastArray();
    }

}
