import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

export const buildDirectRoomId = (userAId, userBId) => {
  if (!userAId || !userBId) return null;
  const [a, b] = [String(userAId), String(userBId)].sort();
  return `dm:${a}:${b}`;
};

export const joinRoom = (roomId, metadata = {}) => {
  if (!roomId) return;
  socket.emit('join', { roomId, ...metadata });
};

export const sendRoomMessage = (roomId, message) => {
  if (!roomId || !message) return;
  socket.emit('message', { roomId, message: { ...message, roomId } });
};

export const sendTyping = (roomId, userId, isTyping) => {
  if (!roomId) return;
  socket.emit('typing', { roomId, userId, isTyping });
};

export default socket;


