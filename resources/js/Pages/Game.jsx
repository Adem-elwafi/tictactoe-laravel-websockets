import { useEffect, useState, useRef, useCallback } from "react";
import axios from 'axios'; 

export default function Game({ room_code, initialGame, mySymbol }) {
    const [game, setGame] = useState(initialGame);
    const [message, setMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

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

    const handleReset = async () => {
        // Prevent double-clicks while request is in flight
        if (isResetting) return;

        setIsResetting(true);

        try {
            const response = await axios.post(`/api/games/${game.id}/reset`);

            console.log('🔄 Game reset:', response.data);

            // Update our own state from the HTTP response
            // (we won't receive our own broadcast due to toOthers())
            if (response.data.success && response.data.data?.game) {
                updateGameState(response.data.data.game);
                showMessage('🔄 Game restarted! Good luck!', 2000); 

            }

        } catch (error) {
            console.error('❌ Reset failed:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Reset failed. Try again.');
        } finally {
            // Always clear loading state, whether success or error
            setIsResetting(false);
        }
    };
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

                // Opponent just joined
                if (gameData.status === 'playing' && previousStatusRef.current === 'waiting') {
                    showMessage('👥 Opponent joined! Game starting...');
                }

                // ← new: game was reset by the other player
                if (gameData.status === 'playing' && previousStatusRef.current === 'finished') {
                    showMessage('🔄 Game restarted! Good luck!', 2000);
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-white tracking-tight">Tic-Tac-Toe</h1>
                            <div style={{
                                padding: '8px 16px',
                                background: '#fff3cd',
                                color: '#856404',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                🟡 Connecting...
                            </div>
                        </div>
                        
                        {/* Loading Content */}
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-xl p-8 text-center">
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    border: '5px solid #e9ecef',
                                    borderTop: '5px solid #6366f1',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 20px'
                                }}></div>
                                <p className="text-gray-600 text-lg">
                                    Establishing connection to game room...
                                </p>
                            </div>
                        </div>
                    </div>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Main Game Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Tic-Tac-Toe</h1>
                        
                        {/* Connection Status Badge */}
                        <div style={{
                            padding: '8px 16px',
                            background: statusDisplay.bg,
                            color: statusDisplay.color,
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {statusDisplay.text}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 space-y-6">
                        {/* Notification message */}
                        {message && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#d4edda',
                                color: '#155724',
                                border: '1px solid #c3e6cb',
                                borderRadius: '8px',
                                animation: 'slideIn 0.3s ease-out',
                                fontWeight: '500'
                            }}>
                                {message}
                            </div>
                        )}
                        {/* Status Section */}
                        <div className="text-center space-y-4">
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
                        onClick={handleReset}
                        disabled={isResetting}
                        className={`px-6 py-2 font-bold rounded-lg transition-colors
                            ${isResetting
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                            }`}
                    >
                        {isResetting ? '⏳ Resetting...' : '🔄 Play Again'}
                    </button>
                </div>
            )}
                        </div>

                        {/* Game Board Section */}
                        <div className="mt-6 flex justify-center">
                            {/* 3×3 Tic-Tac-Toe Board */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl shadow-lg">
                                <div className="grid grid-cols-3 gap-3">
                                    {game.board.map((cell, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleCellClick(index)}
                                            disabled={!canPlay() || (cell !== '' && cell !== null)}
                                            className={`
                                                w-24 h-24 aspect-square border-4 flex items-center justify-center 
                                                text-5xl font-black transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-400 rounded-lg
                                                ${game.status === 'finished' && game.winning_line?.includes(index)
                                                    ? 'border-yellow-400 bg-yellow-200 scale-105 shadow-xl shadow-yellow-400/50 animate-pulse'
                                                    : game.status === 'finished'
                                                        ? 'border-gray-300 bg-gray-50 cursor-default opacity-50'
                                                        : canPlay() && (cell === '' || cell === null)
                                                            ? 'border-slate-600 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-500 hover:scale-105 hover:shadow-lg cursor-pointer'
                                                            : 'border-slate-500 bg-slate-100 cursor-not-allowed opacity-70'
                                                }
                                                ${cell === 'X' ? 'text-blue-600 drop-shadow-[0_2px_4px_rgba(37,99,235,0.5)]' : ''}
                                                ${cell === 'O' ? 'text-orange-600 drop-shadow-[0_2px_4px_rgba(234,88,12,0.5)]' : ''}
                                            `}
                                        >
                                            {cell || ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Warning if reconnecting */}
                        {connectionStatus === 'reconnecting' && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <strong className="text-yellow-800">🔄 Reconnecting...</strong>
                                <p className="mt-2 mb-0 text-yellow-700 text-sm">
                                    Attempting to restore connection (attempt {reconnectAttempt}/{maxReconnectAttempts})
                                </p>
                            </div>
                        )}

                        {/* Warning if connection failed permanently */}
                        {connectionStatus === 'failed' && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <strong className="text-red-800">⚠️ Connection Failed</strong>
                                <p className="mt-2 mb-3 text-red-700 text-sm">
                                    Could not reconnect after {maxReconnectAttempts} attempts. Real-time updates are paused.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                                >
                                    🔄 Refresh Page
                                </button>
                            </div>
                        )}

                        {/* Warning if simply disconnected */}
                        {connectionStatus === 'disconnected' && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <strong className="text-red-800">⚠️ Connection Lost</strong>
                                <p className="mt-2 mb-0 text-red-700 text-sm">
                                    Attempting to reconnect automatically...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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