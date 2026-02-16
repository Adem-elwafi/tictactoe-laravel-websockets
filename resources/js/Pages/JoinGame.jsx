import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function JoinGame({ auth }) {
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/games/join', {
                room_code: roomCode.toUpperCase(),
            });

            console.log('✅ Join successful:', response.data);

            // Check if successful
            if (response.data.success) {
                const gameId = response.data.data.game.id;
                
                // Redirect to game page using Inertia
                router.visit(`/game/${gameId}`);
            } else {
                setError(response.data.message || 'Failed to join game');
                setLoading(false);
            }

        } catch (err) {
            console.error('❌ Join failed:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to join game. Please try again.');
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <h1 style={{ marginBottom: '20px' }}>Join Game</h1>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Room Code:
                    </label>
                    <input
                        type="text"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="Enter room code (e.g., FRESH1)"
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            border: error ? '1px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}
                        maxLength={8}
                        required
                        disabled={loading}
                    />
                </div>

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
                    type="submit"
                    disabled={loading || roomCode.length < 6}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: loading ? '#ccc' : '#007bff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Joining...' : 'Join Game'}
                </button>
            </form>

            <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px' 
            }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    💡 Ask the host for their room code to join the game
                </p>
                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                    Test codes: FRESH1, MIDGM2, WAIT55
                </p>
            </div>
        </div>
    );
}
