import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types/session';

class SocketManager {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://localhost:3000';

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Helper method to set custom server URL (for local network IP)
  setServerUrl(url: string) {
    this.serverUrl = url;
    if (this.socket?.connected) {
      this.disconnect();
    }
  }
}

export const socketManager = new SocketManager();