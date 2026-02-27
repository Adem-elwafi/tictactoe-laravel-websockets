import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
    const [isCreating, setIsCreating] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const handleCreateGame = async () => {
        setIsCreating(true);
        
        try {
            const response = await axios.post('/api/games');
            
            if (response.data.success) {
                const gameId = response.data.data.game.id;
                // Redirect to game room using Inertia
                router.visit(`/game/${gameId}`);
            }
        } catch (error) {
            console.error('Failed to create game:', error);
            alert('Failed to create game. Please try again.');
            setIsCreating(false);
        }
    };

    const handleRoomCodeChange = (e) => {
        const value = e.target.value.toUpperCase();
        setRoomCode(value);
        // Clear error when user starts typing
        if (joinError) setJoinError('');
    };

    const handleJoinGame = async (e) => {
        e.preventDefault();
        
        if (roomCode.length < 6) {
            setJoinError('Room code must be at least 6 characters');
            return;
        }

        setIsJoining(true);
        setJoinError('');
        
        try {
            const response = await axios.post('/api/games/join', {
                room_code: roomCode
            });
            
            if (response.data.success) {
                const gameId = response.data.data.game.id;
                // Redirect to game room using Inertia
                router.visit(`/game/${gameId}`);
            }
        } catch (error) {
            console.error('Failed to join game:', error);
            const errorMessage = error.response?.data?.message || 'Failed to join game. Please check the room code.';
            setJoinError(errorMessage);
            setIsJoining(false);
        }
    };

    return (
        <>
            <Head title="Tic-Tac-Toe Multiplayer" />
            
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="w-full max-w-6xl relative z-10">
                    {/* Hero Section */}
                    <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                            Tic-Tac-Toe Multiplayer
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-white/95 font-medium">
                            Play real-time Tic-Tac-Toe with friends
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-white/80 text-sm">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span>Real-time multiplayer</span>
                        </div>
                    </div>

                    {/* Two-Column Cards */}
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8">
                        {/* Create Game Card */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 animate-slide-in-left">
                            <div className="text-center">
                                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 animate-bounce-slow">🎮</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                                    Create New Game
                                </h2>
                                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                    Start a new game and invite your friend with a room code
                                </p>
                                <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <p className="text-xs sm:text-sm text-indigo-700 font-medium">
                                        ⭕ You'll be <span className="font-bold">Player X</span> (host)
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCreateGame}
                                    disabled={isCreating}
                                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 shadow-lg text-base sm:text-lg ${
                                        isCreating 
                                            ? 'opacity-70 cursor-not-allowed' 
                                            : 'hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 hover:shadow-xl'
                                    }`}
                                >
                                    {isCreating ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating Game...
                                        </span>
                                    ) : (
                                        'Create Game'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Join Game Card */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 animate-slide-in-right">
                            <form onSubmit={handleJoinGame}>
                                <div className="text-center">
                                    <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 animate-bounce-slow">🚪</div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                                        Join Game
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                        Have a room code? Enter it below to join your friend
                                    </p>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={handleRoomCodeChange}
                                        placeholder="ENTER CODE"
                                        maxLength={8}
                                        disabled={isJoining}
                                        className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-center text-base sm:text-lg font-bold border-2 rounded-xl mb-4 uppercase focus:outline-none focus:ring-2 transition-all ${
                                            joinError 
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                                        } ${isJoining ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                    />
                                    
                                    {joinError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                                            <p className="text-xs sm:text-sm text-red-600 font-medium">{joinError}</p>
                                        </div>
                                    )}
                                    
                                    <button 
                                        type="submit"
                                        disabled={isJoining || roomCode.length < 6}
                                        className={`w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 shadow-lg text-base sm:text-lg ${
                                            (isJoining || roomCode.length < 6)
                                                ? 'opacity-70 cursor-not-allowed' 
                                                : 'hover:from-pink-700 hover:to-rose-700 transform hover:scale-105 hover:shadow-xl'
                                        }`}
                                    >
                                        {isJoining ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Joining...
                                            </span>
                                        ) : (
                                            'Join Game'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 animate-fade-in">
                        <p className="text-white/70 text-sm">
                            Built with Laravel, Inertia, React & WebSockets
                        </p>
                        <p className="text-white/50 text-xs mt-2">
                            Challenge your friends in real-time! 🎯
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-in-left {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                .animate-slide-in-left {
                    animation: slide-in-left 0.6s ease-out;
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.6s ease-out 0.1s both;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </>
    );
}
