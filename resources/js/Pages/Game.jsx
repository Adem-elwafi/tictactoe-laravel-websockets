import { useEffect, useState, useRef, useCallback } from "react";
import axios from 'axios'; 

export default function Game({ room_code, initialGame, mySymbol }) {
    const [game, setGame] = useState(initialGame);
    const [message, setMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    // Use refs to prevent stale closures
    const reconnectTimeoutRef = useRef(null);
    const messageTimeoutRef = useRef(null);
    const previousStatusRef = useRef(initialGame.status);
    const maxReconnectAttempts = 5;

    // Debounced state update to prevent rapid re-renders
    const updateGameState = useCallback((newGameData) => {
        setGame(prevGame => {
            // Only update if data actually changed
            if (JSON.stringify(prevGame) === JSON.stringify(newGameData)) {
                return prevGame;
            }
            return newGameData;
        });
    }, []);

    // Show notification message with auto-clear
    const showMessage = useCallback((text, duration = 3000) => {
        // Clear existing timeout
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
        }
        
        setMessage(text);
        
        messageTimeoutRef.current = setTimeout(() => {
            setMessage('');
        }, duration);
    }, []);

    const handleCellClick = async (index) => {
        console.log('Attempting move at position:', index);
        
        if (!canPlay()) return;
        if (game.board[index] !== '' && game.board[index] !== null) return;
        
        setIsLoading(true);
        
        try {
            const response = await axios.post(`/api/games/${game.id}/move`, {
                position: index
            });
            
            console.log('Move successful:', response.data);
            
            // ← FIX for Bug 3: Update state immediately from API response
            if (response.data.success && response.data.data.game) {
                updateGameState(response.data.data.game);
            }
            
        } catch (error) {
            console.error('Move failed:', error.response?.data || error.message);
            
            // Optional: show user-friendly error
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ← FIX for Bug 2: Remove getMySymbol() and use mySymbol prop directly

// ← FIX for Bug 2: Check if it's your turn using mySymbol prop
const isMyTurn = () => {
    return game.current_turn === mySymbol;
};

// ← FIX for Bug 2 & 4: Check if game is playable
const canPlay = () => {
    return game.status === 'playing' && isMyTurn() && !isLoading;
};
    useEffect(() => {
        if (!window.Echo) {
            console.error("❌ Echo not found");
            setConnectionStatus('failed');
            setIsInitialLoad(false);
            return;
        }

        console.log("Initial game state:", initialGame);
        console.log("My symbol:", mySymbol);

        const channelName = `game.${game.id}`;
        console.log("📡 Subscribing to channel:", channelName);

        // Subscribe to the PUBLIC channel (not private)
        const channel = window.Echo.channel(channelName)
            .subscribed(() => {
                console.log('✅ Successfully subscribed to', channelName);
            })
            .listen('GameUpdated', (data) => {
                console.log('GameUpdated event received:', data);
                const gameData = data.game || data;
                console.log('Extracted game data:', gameData);
                
                // Check if opponent just joined (status changed from waiting to playing)
                if (gameData.status === 'playing' && previousStatusRef.current === 'waiting') {
                    showMessage('Opponent joined! Game starting...');
                }
                
                // Update ref for next comparison
                previousStatusRef.current = gameData.status;
                
                // Update game state
                updateGameState(gameData);
            })
            .listen('PlayerJoined', (data) => {
                console.log('PlayerJoined event received:', data);
                const gameData = data.game || data;
                console.log('Extracted game data from PlayerJoined:', gameData);
                updateGameState(gameData);
            })
            .error((error) => {
                console.error("❌ Channel subscription error:", error);
                setConnectionStatus('disconnected');
                setIsInitialLoad(false);
            });

        // Automatic reconnection with exponential backoff
        const attemptReconnect = (attempt) => {
            if (attempt >= maxReconnectAttempts) {
                console.log('Max reconnection attempts reached');
                setConnectionStatus('failed');
                return;
            }

            const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
            
            console.log(`🔄 Reconnecting in ${delay/1000}s (attempt ${attempt + 1}/${maxReconnectAttempts})`);
            setReconnectAttempt(attempt + 1);
            setConnectionStatus('reconnecting');

            reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`🔄 Reconnect attempt ${attempt + 1}`);
                
                try {
                    window.Echo.connector.pusher.connect();
                } catch (error) {
                    console.error('Reconnect failed:', error);
                    attemptReconnect(attempt + 1);
                }
            }, delay);
        };

        // Connection event handlers
        const handleConnected = () => {
            console.log('✅ Echo connected');
            setConnectionStatus('connected');
            setReconnectAttempt(0);
            setIsInitialLoad(false);
            
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        const handleDisconnected = () => {
            console.log('🔴 Echo disconnected');
            setConnectionStatus('disconnected');
            setIsInitialLoad(false);
            attemptReconnect(0);
        };

        const handleConnecting = () => {
            console.log('🟡 Echo connecting...');
            setConnectionStatus('connecting');
        };

        // Bind connection events
        window.Echo.connector.pusher.connection.bind('connected', handleConnected);
        window.Echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        window.Echo.connector.pusher.connection.bind('connecting', handleConnecting);

        // Set initial status
        const currentState = window.Echo.connector.pusher.connection.state;
        if (currentState === 'connected') {
            setConnectionStatus('connected');
            setIsInitialLoad(false);
        } else if (currentState === 'connecting') {
            setConnectionStatus('connecting');
        }

        // Handle page visibility changes (user switches tabs)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // User came back to tab - check connection
                const state = window.Echo.connector.pusher.connection.state;
                if (state === 'disconnected' || state === 'unavailable') {
                    console.log('Page visible again, reconnecting...');
                    window.Echo.connector.pusher.connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            // Clear all timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }

            // Remove visibility listener
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            // Unbind connection events
            window.Echo.connector.pusher.connection.unbind('connected', handleConnected);
            window.Echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            window.Echo.connector.pusher.connection.unbind('connecting', handleConnecting);

            // Stop listening and leave channel
            channel.stopListening('GameUpdated');
            channel.stopListening('PlayerJoined');
            window.Echo.leave(channelName);
            console.log("📡 Leaving channel:", channelName);
        };
    }, [game.id, updateGameState, showMessage]); // Changed: use game.id instead of room_code

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

    // Loading skeleton while initial connection establishes
    if (isInitialLoad && connectionStatus === 'connecting') {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h1 style={{ margin: 0 }}>Game Room</h1>
                    <div style={{
                        padding: '8px 16px',
                        background: '#fff3cd',
                        color: '#856404',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>
                        🟡 Connecting...
                    </div>
                </div>
                
                <div style={{
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #e9ecef',
                        borderTop: '5px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#6c757d', margin: 0 }}>
                        Establishing connection to game room...
                    </p>
                </div>
                
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

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

            
            {/* Notification message */}
            {message && (
                <div style={{
                    padding: '10px',
                    background: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {message}
                </div>
            )}
            {/* Status Section */}
        <div className="mb-6 text-center">
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Room Code</p>
                <p className="text-2xl font-bold text-gray-800">{room_code}</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">You are</p>
                <p className="text-3xl font-bold text-blue-600">{mySymbol || 'N/A'}</p>
            </div>
            
            {game.status === 'waiting' && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                    <p className="text-yellow-800 font-semibold">
                        ⏳ Waiting for opponent...
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                        Share room code: <span className="font-mono font-bold">{room_code}</span>
                    </p>
                </div>
            )}
            
            {game.status === 'playing' && (
                <div className={`rounded-lg p-4 border-2 ${
                    isMyTurn() 
                        ? 'bg-green-50 border-green-400' 
                        : 'bg-gray-50 border-gray-300'
                }`}>
                    <p className={`font-bold text-lg ${
                        isMyTurn() ? 'text-green-700' : 'text-gray-600'
                    }`}>
                        {isMyTurn() ? '✨ YOUR TURN' : '⏳ Opponent\'s turn'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Current turn: <span className="font-bold">{game.current_turn}</span>
                    </p>
                </div>
            )}
        </div>
            {/* Game state display */}
            <div style={{ marginTop: '20px' }}>
                {/* 3×3 Tic-Tac-Toe Board */}
            <div className="grid grid-cols-3 gap-2 w-64 mx-auto">
                {game.board.map((cell, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleCellClick(index)}
                        disabled={!canPlay() || (cell !== '' && cell !== null)}
                        className={`
                            w-20 h-20 border-2 flex items-center justify-center 
                            text-3xl font-bold transition-all
                            ${canPlay() && (cell === '' || cell === null)
                                ? 'border-gray-400 bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                                : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                            }
                            ${cell === 'X' ? 'text-blue-600' : ''}
                            ${cell === 'O' ? 'text-red-600' : ''}
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                        `}
                    >
                        {cell || ''}
                    </button>
                ))}
            </div>
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

            {/* Warning if simply disconnected */}
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

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}