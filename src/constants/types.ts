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
