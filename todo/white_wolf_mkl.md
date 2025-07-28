Okay next steps in this is to integrate web sockets...
What we need to do?

- Create a backend for the game to enable pvp.
- Backend & frontend will communicate via web sockets.
- There will be game rooms on the backend, where the game will be played between two players.
- No authentication is required to join the room just a code.
- Players will be session based so we'll give them a random name and tie it to the session.
- Inside a room, any game events will be synced on both devices with web sockets.
- Whenever a player makes a move like sow or pick we will sync it to backend.
- When backend recieves this, it will send a message to other machines.
- The other machine recieves this message and applies the state change.
- And same loop continues.
- Backend has no role in case of pve, that can be handled entirely on client side.

Considerations:

- Allow for reconnect on disconnect with a max timeout, so players can join with same session.
- After timeout we remove both players and close the room.
- Have a button on frontend to leave the room.
- Vote to end game early.

Fun thing to add:

- Emoji's that shows to other player (Like clash royale).
- Hurry Up! Button to urge other player to play their turn fast! (Since we aren't implementing max timer for a turn and someone can just sit their indefinetly)
