export type CreateRoomSuccessResponse = {
  success: boolean;
  id: string;
};

export type MessageData = {
  roomId: string;
  content: string;
  author: string | null;
  createdAt: Date;
};

export type SavedMessage = {
  id: number;
  roomId: string;
  content: string;
  author: string | null;
  createdAt: Date;
};
export type SocketMessage = {
  type: 'room_joined' | 'room_left' | 'new_message' | 'error' | 'connection';
  roomId?: string;
  messages?: SavedMessage[];
  message?: SavedMessage;
  error?: string;
  data?: { clientId: string };
};
