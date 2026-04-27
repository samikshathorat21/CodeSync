import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const stompClient = new Client({
  brokerURL: WS_URL,
  connectHeaders: {
    Authorization: `Bearer ${localStorage.getItem('codesync_access_token')}`,
  },
  debug: (str) => {
    console.log(str);
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
  webSocketFactory: () => {
    // If you need SockJS fallback
    const url = WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');
    return new SockJS(url);
  },
});

export const connectStomp = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (stompClient.connected) {
      resolve();
      return;
    }

    // Update headers right before connecting
    stompClient.connectHeaders = {
      Authorization: `Bearer ${localStorage.getItem('codesync_access_token')}`,
    };

    stompClient.onConnect = () => {
      console.log('STOMP Connected');
      resolve();
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP Error', frame);
      reject(frame);
    };

    stompClient.onWebSocketError = (event) => {
      console.error('WebSocket Error', event);
      reject(event);
    };

    stompClient.activate();
  });
};

export const disconnectStomp = () => {
  if (stompClient.active) {
    stompClient.deactivate();
  }
};
