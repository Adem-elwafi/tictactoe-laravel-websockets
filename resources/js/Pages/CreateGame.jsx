import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function CreateGame() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/games');

            console.log('✅ Game created:', response.data);

            if (response.data.success) {
                const gameId = response.data.data.game.id;
                const roomCode = response.data.data.game.room_code;

                console.log('🎮 Game ID:', gameId);
                console.log('🔑 Room Code:', roomCode);

                // Redirect to the game
                router.visit(`/game/${gameId}`);
            }

        } catch (err) {
            console.error('❌ Create failed:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to create game');
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '50px auto', 
            padding: '30px',
            fontFamily: 'sans-serif',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: 'white'
        }}>
            <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Create New Game</h1>
            
            {error && (
                <div style={{ 
                    color: '#721c24',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleCreate}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: loading ? '#ccc' : '#28a745',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px'
                }}
            >
                {loading ? 'Creating Game...' : '🎮 Create New Game'}
            </button>

            <div style={{ 
                padding: '15px', 
                backgroundColor: '#d1ecf1', 
                borderRadius: '4px',
                border: '1px solid #bee5eb',
                marginBottom: '20px'
            }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
                    💡 You'll be <strong>Player X</strong> (host)
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#0c5460' }}>
                    Share the room code with a friend!
                </p>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

            <button
                onClick={() => router.visit('/join-game')}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#007bff',
                    backgroundColor: 'white',
                    border: '2px solid #007bff',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Join Existing Game Instead
            </button>
        </div>
    );
}