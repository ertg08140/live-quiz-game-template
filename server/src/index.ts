import { WebSocketServer } from 'ws';
import { startWsServer } from './server';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

startWsServer(wss);
