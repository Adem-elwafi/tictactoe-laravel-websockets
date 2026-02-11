import { useEffect, useState } from "react";

export default function Game({ room_code, initialGame }) {
    // Add state to track game data
    const [game, setGame] = useState(initialGame);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!window.Echo) {
            console.error("Echo not found");
            return;
        }

        console.log("Room code:", room_code);
        console.log("Initial game state:", initialGame);

        const channelName = `game.${room_code}`;
        console.log("Listening on channel:", channelName);

        const channel = window.Echo.private(channelName)
            .listen(".game.updated", (payload) => {
                console.log("Game updated event received:", payload);
                
                // UPDATE STATE with new game data
                setGame(payload);
                
                // Show message when opponent joins
                if (payload.status === 'playing' && game.status === 'waiting') {
                    setMessage('Opponent joined! Game starting...');
                    
                    // Clear message after 3 seconds
                    setTimeout(() => setMessage(''), 3000);
                }
            });

        return () => {
            window.Echo.leave(channelName);
            console.log("Stopped listening on channel:", channelName);
        };
    }, [room_code, game.status]); // Added game.status to dependencies

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Game Room</h1>
            <p><strong>Room code:</strong> {room_code}</p>
            
            {/* Show notification message */}
            {message && (
                <div style={{
                    padding: '10px',
                    background: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '15px'
                }}>
                    {message}
                </div>
            )}
            
            {/* Show current game state */}
            <div style={{ marginTop: '20px' }}>
                <p><strong>Status:</strong> {game.status}</p>
                <p><strong>Current turn:</strong> {game.current_turn}</p>
                <p><strong>Board:</strong> {JSON.stringify(game.board)}</p>
                
                {game.status === 'waiting' && (
                    <p style={{ color: '#856404', background: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
                        Waiting for opponent to join...
                    </p>
                )}
                
                {game.status === 'playing' && (
                    <p style={{ color: '#004085', background: '#cce5ff', padding: '10px', borderRadius: '4px' }}>
                        Game in progress!
                    </p>
                )}
            </div>
        </div>
    );
}