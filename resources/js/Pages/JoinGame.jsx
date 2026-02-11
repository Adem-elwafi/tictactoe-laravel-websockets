import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function JoinGame({ auth }) {
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Generate or get session_id from localStorage
    const getSessionId = () => {
        let sessionId = localStorage.getItem('game_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('game_session_id', sessionId);
        }
        return sessionId;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/games/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',

                },
                credentials: 'same-origin', 
                body: JSON.stringify({
                    room_code: roomCode.toUpperCase(),
                    session_id: getSessionId(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to join game');
            }

            // Success! Redirect to game room using Inertia
            router.visit(`/games/room/${data.data.room_code}`);

        } catch (err) {
            setError(err.message);
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
                        placeholder="Enter room code (e.g., TEST456)"
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            border: error ? '1px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}
                        maxLength={7}
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
                    disabled={loading || roomCode.length !== 7}
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
            </div>
        </div>
    );
}