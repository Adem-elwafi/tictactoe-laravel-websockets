import { useEffect } from "react";

export default function Game({ room_code, initialGame }) {
    useEffect(() => {
        if (!window.Echo) {
            console.error("Echo not found");
            return;
        }

        console.log("Room code:", room_code);
        console.log("Initial game state:", initialGame);

        const channelName = `game.${room_code}`;

        console.log("Listening on channel:", channelName);

        const channel = window.Echo.private(channelName)
            .listen(".game.updated", (payload) => {
                console.log("Game updated event received:", payload);
            });

        return () => {
            window.Echo.leave(channelName);
            console.log("Stopped listening on channel:", channelName);
        };
    }, [room_code]);

    return (
        <div>
            <h1>Game Room</h1>
            <p>Room code: {room_code}</p>
        </div>
    );
}
