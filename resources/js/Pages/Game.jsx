import { useEffect, useState } from "react";

export default function Game({ room_code, initialGame }) {
    const [game, setGame] = useState(initialGame);
    const [message, setMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected'

    useEffect(() => {
        if (!window.Echo) {
            console.error("Echo not found");
            setConnectionStatus('disconnected');
            return;
        }

        console.log("Room code:", room_code);
        console.log("Initial game state:", initialGame);

        const channelName = `game.${room_code}`;
        console.log("Subscribing to channel:", channelName);

        // Subscribe to the private channel
        const channel = window.Echo.private(channelName)
            .listen(".game.updated", (payload) => {
                console.log("Game updated event received:", payload);
                
                // Update game state
                setGame(payload);
                
                // Show message when opponent joins
                if (payload.status === 'playing' && game.status === 'waiting') {
                    setMessage('Opponent joined! Game starting...');
                    setTimeout(() => setMessage(''), 3000);
                }
            })
            .error((error) => {
                console.error("Channel subscription error:", error);
                setConnectionStatus('disconnected');
            });

        // Listen for Echo connection events
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('Echo connected');
            setConnectionStatus('connected');
        });

        window.Echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('Echo disconnected');
            setConnectionStatus('disconnected');
        });

        window.Echo.connector.pusher.connection.bind('connecting', () => {
            console.log('Echo connecting...');
            setConnectionStatus('connecting');
        });

        // Set initial status based on current connection state
        if (window.Echo.connector.pusher.connection.state === 'connected') {
            setConnectionStatus('connected');
        }

        // Cleanup on unmount
        return () => {
            window.Echo.leave(channelName);
            console.log("Unsubscribed from channel:", channelName);
        };
    }, [room_code, game.status]);

    // Helper function to get status badge color
    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return { bg: '#d4edda', color: '#155724', text: '🟢 Connected' };
            case 'connecting':
                return { bg: '#fff3cd', color: '#856404', text: '🟡 Connecting...' };
            case 'disconnected':
                return { bg: '#f8d7da', color: '#721c24', text: '🔴 Disconnected' };
            default:
                return { bg: '#e2e3e5', color: '#383d41', text: '⚪ Unknown' };
        }
    };

    const statusStyle = getStatusColor();

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h1 style={{ margin: 0 }}>Game Room</h1>
                
                {/* Connection Status Badge */}
                <div style={{
                    padding: '8px 16px',
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    {statusStyle.text}
                </div>
            </div>

            <p><strong>Room code:</strong> {room_code}</p>
            
            {/* Notification message */}
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
            
            {/* Game state display */}
            <div style={{ marginTop: '20px' }}>
                <p><strong>Status:</strong> {game.status}</p>
                <p><strong>Current turn:</strong> {game.current_turn}</p>
                <p><strong>Board:</strong> {JSON.stringify(game.board)}</p>
                
                {game.status === 'waiting' && (
                    <p style={{ 
                        color: '#856404', 
                        background: '#fff3cd', 
                        padding: '10px', 
                        borderRadius: '4px' 
                    }}>
                        ⏳ Waiting for opponent to join...
                    </p>
                )}
                
                {game.status === 'playing' && (
                    <p style={{ 
                        color: '#004085', 
                        background: '#cce5ff', 
                        padding: '10px', 
                        borderRadius: '4px' 
                    }}>
                        🎮 Game in progress!
                    </p>
                )}
            </div>

            {/* Warning if disconnected */}
            {connectionStatus === 'disconnected' && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px'
                }}>
                    <strong>⚠️ Connection lost</strong>
                    <p style={{ marginTop: '5px', marginBottom: 0 }}>
                        Real-time updates are paused. Refresh the page to reconnect.
                    </p>
                </div>
            )}
        </div>
    );
}