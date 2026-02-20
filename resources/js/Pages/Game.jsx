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
        if (!canPlay()) {
            console.log('❌ Cannot play - not your turn or game inactive');
            return;
        }
        
        if (game.board[index] !== '' && game.board[index] !== null) {
            console.log('❌ Cell already occupied');
            return;
        }
        
        console.log('🎯 Attempting move at position:', index);
        
        try {
            const response = await axios.post(`/api/games/${game.id}/move`, {
                position: index
            });
            
            console.log('✅ Move successful:', response.data);
            
            // CRITICAL: Update state immediately from API response
            if (response.data.success && response.data.data?.game) {
                console.log('🔄 Updating state from API response');
                updateGameState(response.data.data.game);
            }
            
        } catch (error) {
            console.error('❌ Move failed:', error.response?.data || error.message);
            
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
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
        const channelName = `game.${initialGame.id}`;
        console.log('🔌 Subscribing to channel:', channelName);
        
        // Subscribe to PUBLIC channel (not private)
        const channel = window.Echo.channel(channelName)
            .subscribed(() => {
                console.log('✅ Successfully subscribed to', channelName);
                setConnectionStatus('connected');
            })
            .listen('.GameUpdated', (data) => {
                console.log('📡 GameUpdated event received:', data);
                
                const gameData = data.game || data;
                console.log('📊 Extracted game data:', gameData);
                
                // Check if opponent just joined
                if (gameData.status === 'playing' && previousStatusRef.current === 'waiting') {
                    showMessage('Opponent joined! Game starting...');
                }
                
                previousStatusRef.current = gameData.status;
                updateGameState(gameData);
            })
            .listen('.PlayerJoined', (data) => {
                console.log('👥 PlayerJoined event received:', data);
                const gameData = data.game || data;
                updateGameState(gameData);
            })
            .error((error) => {
                console.error('❌ Channel error:', error);
                setConnectionStatus('disconnected');
            });

        // Cleanup function
        return () => {
            console.log('🔌 Unsubscribing from', channelName);
            channel.stopListening('GameUpdated');
            channel.stopListening('PlayerJoined');
            window.Echo.leaveChannel(channelName);
        };
    }, [initialGame.id, updateGameState, showMessage]);

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
                        {isMyTurn() ? '✨ YOUR TURN' : "⏳ Opponent's turn"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Current turn: <span className="font-bold">{game.current_turn}</span>
                    </p>
                </div>
            )}
            {/* Game Over Banner */}
            {game.status === 'finished' && (
                <div className={`rounded-lg p-6 border-2 text-center ${
                    game.winner === 'draw'
                        ? 'bg-gray-50 border-gray-400'
                        : game.winner === mySymbol
                            ? 'bg-green-50 border-green-500'
                            : 'bg-red-50 border-red-400'
                }`}>
                    <p className="text-4xl font-bold mb-2">
                        {game.winner === 'draw'
                            ? "🤝 It's a Draw!"
                            : game.winner === mySymbol
                                ? '🎉 You Win!'
                                : '😔 You Lose!'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                        {game.winner === 'draw'
                            ? 'Nobody wins this time.'
                            : `${game.winner} takes the victory!`}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        🔄 Play Again
                    </button>
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
                                text-3xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${game.status === 'finished' && game.winning_line?.includes(index)
                                    ? 'border-yellow-500 bg-yellow-100 scale-105'
                                    : game.status === 'finished'
                                        ? 'border-gray-200 bg-white cursor-default opacity-80'
                                        : canPlay() && (cell === '' || cell === null)
                                            ? 'border-gray-400 bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                                            : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                }
                                ${cell === 'X' ? 'text-blue-600' : ''}
                                ${cell === 'O' ? 'text-red-600' : ''}
                            `}
                    >
                        {cell || ''}
                    </button>
                ))}
            </div>

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