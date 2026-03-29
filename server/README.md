# Quiz Server

WebSocket server for Live Quiz Game built with Node.js and TypeScript.

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts               # Server setup and configuration
│   ├── types.ts                # TypeScript type definitions
│   ├── db/                      # Database connection
│   │   └── index.ts
│   ├── handler/                 # WebSocket event handlers
│   │   ├── handlers.ts         # Handler setup
│   │   ├── loginHandler.ts     # Login logic
│   │   ├── gameManagmentHandler.ts  # Game creation and management
│   │   ├── gamePlayHandler.ts  # Game play events
│   │   └── exitHandler.ts      # Connection cleanup
│   └── utils/                   # Utility functions
│       ├── broadcastMessage.ts # Message broadcasting
│       └── transformDataToMessage.ts # Data transformation
├── package.json
├── tsconfig.json
└── README.md
```

## npm Scripts

| Command              | Description                                        |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Start development server with hot reload using tsx |
| `npm run build`      | Compile TypeScript to JavaScript                   |
| `npm run start`      | Run the compiled server                            |
| `npm run type-check` | Check TypeScript types without emitting files      |

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build & Run

```bash
npm run build
npm start
```
