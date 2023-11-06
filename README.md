# About

Play Now: TODO

Read more about the game and rules on Wikipedia page: https://en.wikipedia.org/wiki/6_nimmt!

# Features

- Chat, rooms, WebSockets, Socket.io
- "6th takes" card game
- Responsive design
- Bots

# Project Structure

This project is using Yarn Workspaces, to share code between server and client (back-end and front-end)

```sh
# Front-end React app
client
# Back-end Socket.io Node.js server
server
# Common code for Front-end and Back-end. Socket events, TakeSix and other utilities
common
```

As for tests, only Back-end part is automatically tested (with multi-client scenarios). Front-end part is tested mostly manually, with the help of Storybook.

# Techs

- Git
- Docker
- TypeScript
- JavaScript
- Node.js
- Yarn (with workspaces)
- ESLint
- Prettier
- Jest
- Socket.io
- Zod

## Front-end

- Vite
- React
- Redux Toolkit
- Tailwind CSS
- FontAwesome
- Storybook
