import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Debug: Log Vite environment variables
console.log('🔧 Reverb Config:', {
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: import.meta.env.VITE_REVERB_PORT,
    scheme: import.meta.env.VITE_REVERB_SCHEME,
});

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    encrypted: false,
    
    // Critical: Add auth endpoint for connection
    authEndpoint: '/broadcasting/auth',
    
    // Add connection state logging
    cluster: '',
});

// Add global connection state listeners
if (window.Echo.connector && window.Echo.connector.pusher) {
    const pusher = window.Echo.connector.pusher;
    
    pusher.connection.bind('connecting', () => {
        console.log('🔄 Pusher: Connecting...');
    });
    
    pusher.connection.bind('connected', () => {
        console.log('✅ Pusher: Connected');
    });
    
    pusher.connection.bind('unavailable', () => {
        console.error('❌ Pusher: Connection unavailable');
    });
    
    pusher.connection.bind('failed', () => {
        console.error('❌ Pusher: Connection failed');
    });
    
    pusher.connection.bind('disconnected', () => {
        console.warn('⚠️ Pusher: Disconnected');
    });
    
    pusher.connection.bind('error', (err) => {
        console.error('❌ Pusher Error:', err);
    });
}