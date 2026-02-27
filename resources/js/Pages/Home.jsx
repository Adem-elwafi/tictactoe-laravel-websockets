import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
    const [isCreating, setIsCreating] = useState(false);

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

    return (
        <>
            <Head title="Tic-Tac-Toe Multiplayer" />
            
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                            Tic-Tac-Toe Multiplayer
                        </h1>
                        <p className="text-xl text-white/90">
                            Play real-time Tic-Tac-Toe with friends
                        </p>
                    </div>

                    {/* Two-Column Cards */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Create Game Card */}
                        <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-shadow duration-300">
                            <div className="text-center">
                                <div className="text-6xl mb-6">🎮</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                    Create New Game
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Start a new game and invite your friend with a room code
                                </p>
                                <button 
                                    onClick={handleCreateGame}
                                    disabled={isCreating}
                                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg ${
                                        isCreating 
                                            ? 'opacity-70 cursor-not-allowed' 
                                            : 'hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
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
                        <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-shadow duration-300">
                            <div className="text-center">
                                <div className="text-6xl mb-6">🚪</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                    Join Game
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Have a room code? Enter it below to join your friend
                                </p>
                                <input
                                    type="text"
                                    placeholder="ENTER CODE"
                                    className="w-full px-6 py-4 text-center text-lg font-bold border-2 border-gray-300 rounded-xl mb-4 uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                                <button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                                    Join Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
