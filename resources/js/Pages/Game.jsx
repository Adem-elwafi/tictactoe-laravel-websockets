import { useEffect, useState, useRef } from "react";

export default function Game({ room_code, initialGame }) {
    const [game, setGame] = useState(initialGame);
    const [message, setMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    
    // Use refs to prevent stale closures in timeouts
    const reconnectTimeoutRef = useRef(null);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        if (!window.Echo) {
            console.error("Echo not found");
            setConnectionStatus('failed');
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

        // Handle connection events with auto-reconnect
        const handleConnected = () => {
            console.log('Echo connected');
            setConnectionStatus('connected');
            setReconnectAttempt(0); // Reset attempt counter on success
            
            // Clear any pending reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        const handleDisconnected = () => {
            console.log('Echo disconnected');
            setConnectionStatus('disconnected');
            
            // Start automatic reconnection
            attemptReconnect(0);
        };

        const handleConnecting = () => {
            console.log('Echo connecting...');
            setConnectionStatus('connecting');
        };

        // Automatic reconnection with exponential backoff
        const attemptReconnect = (attempt) => {
            if (attempt >= maxReconnectAttempts) {
                console.log('Max reconnection attempts reached');
                setConnectionStatus('failed');
                return;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
            
            console.log(`Reconnecting in ${delay/1000}s (attempt ${attempt + 1}/${maxReconnectAttempts})`);
            setReconnectAttempt(attempt + 1);
            setConnectionStatus('reconnecting');

            reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Reconnect attempt ${attempt + 1}`);
                
                try {
                    // Try to reconnect
                    window.Echo.connector.pusher.connect();
                } catch (error) {
                    console.error('Reconnect failed:', error);
                    attemptReconnect(attempt + 1);
                }
            }, delay);
        };

        // Bind connection events
        window.Echo.connector.pusher.connection.bind('connected', handleConnected);
        window.Echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        window.Echo.connector.pusher.connection.bind('connecting', handleConnecting);

        // Set initial status based on current connection state
        const currentState = window.Echo.connector.pusher.connection.state;
        if (currentState === 'connected') {
            setConnectionStatus('connected');
        } else if (currentState === 'connecting') {
            setConnectionStatus('connecting');
        }

        // Cleanup on unmount
        return () => {
            // Clear reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            // Unbind connection events
            window.Echo.connector.pusher.connection.unbind('connected', handleConnected);
            window.Echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            window.Echo.connector.pusher.connection.unbind('connecting', handleConnecting);

            // Leave channel
            window.Echo.leave(channelName);
            console.log("Unsubscribed from channel:", channelName);
        };
    }, [room_code, game.status]);

    // Helper function to get status badge
    const getStatusDisplay = () => {
        switch (connectionStatus) {
            case 'connected':
                return { 
                    bg: '#d4edda', 
                    color: '#155724', 
                    text: '🟢 Connected' 
                };
            case 'connecting':
                return { 
                    bg: '#fff3cd', 
                    color: '#856404', 
                    text: '🟡 Connecting...' 
                };
            case 'reconnecting':
                return { 
                    bg: '#fff3cd', 
                    color: '#856404', 
                    text: `🟡 Reconnecting... (${reconnectAttempt}/${maxReconnectAttempts})` 
                };
            case 'disconnected':
                return { 
                    bg: '#f8d7da', 
                    color: '#721c24', 
                    text: '🔴 Disconnected' 
                };
            case 'failed':
                return { 
                    bg: '#f8d7da', 
                    color: '#721c24', 
                    text: '🔴 Connection Failed' 
                };
            default:
                return { 
                    bg: '#e2e3e5', 
                    color: '#383d41', 
                    text: '⚪ Unknown' 
                };
        }
    };

    const statusDisplay = getStatusDisplay();

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
                    background: statusDisplay.bg,
                    color: statusDisplay.color,
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    {statusDisplay.text}
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

            {/* Warning if reconnecting */}
            {connectionStatus === 'reconnecting' && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px'
                }}>
                    <strong>🔄 Reconnecting...</strong>
                    <p style={{ marginTop: '5px', marginBottom: 0 }}>
                        Attempting to restore connection (attempt {reconnectAttempt}/{maxReconnectAttempts})
                    </p>
                </div>
            )}

            {/* Warning if connection failed permanently */}
            {connectionStatus === 'failed' && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px'
                }}>
                    <strong>⚠️ Connection Failed</strong>
                    <p style={{ marginTop: '5px', marginBottom: '10px' }}>
                        Could not reconnect after {maxReconnectAttempts} attempts. Real-time updates are paused.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Refresh Page
                    </button>
                </div>
            )}

            {/* Warning if simply disconnected (before retry starts) */}
            {connectionStatus === 'disconnected' && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px'
                }}>
                    <strong>⚠️ Connection Lost</strong>
                    <p style={{ marginTop: '5px', marginBottom: 0 }}>
                        Attempting to reconnect automatically...
                    </p>
                </div>
            )}
        </div>
    );
}