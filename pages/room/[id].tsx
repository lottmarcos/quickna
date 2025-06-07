import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import { http } from 'src/frontend/api/http';
import { useIsNextLoading, useWebSocket } from 'src/frontend/hooks';
import { Room } from 'src/frontend/pages';

const RoomPage: React.FC = () => {
  const router = useRouter();
  const { id: roomId } = router.query;
  const [roomName, setRoomName] = useState<string | null>(null);
  const isNextLoading = useIsNextLoading();
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isValidatingRoom, setIsValidatingRoom] = useState(true);

  const { isConnected, messages, isInRoom, joinRoom, leaveRoom, sendMessage } =
    useWebSocket();

  const isLoading = useMemo(
    () => isNextLoading || isValidatingRoom || !isConnected || !isInRoom,
    [isNextLoading, isValidatingRoom, isConnected, isInRoom]
  );

  useEffect(() => {
    if (roomId && typeof roomId === 'string') {
      setIsValidatingRoom(true);
      http
        .get(`/api/v1/room?room=${roomId}`)
        .then((response) => {
          const roomExists = response.success && (response.room || response.id);
          if (!roomExists) {
            router.push('/room/not-found');
          } else {
            setIsValidatingRoom(false);
            setRoomName(response.room?.name || response.id);
          }
        })
        .catch(() => {
          router.push('/room/not-found');
        });
    }
  }, [roomId, router]);

  useEffect(() => {
    if (
      roomId &&
      typeof roomId === 'string' &&
      isConnected &&
      !isInRoom &&
      !hasJoinedRoom &&
      !isValidatingRoom
    ) {
      joinRoom(roomId);
      setHasJoinedRoom(true);
    }

    return () => leaveRoom();
  }, [
    roomId,
    isConnected,
    isInRoom,
    joinRoom,
    leaveRoom,
    hasJoinedRoom,
    isValidatingRoom,
  ]);

  useEffect(() => {
    if (!isConnected) {
      setHasJoinedRoom(false);
    }
  }, [isConnected]);

  return (
    <Room
      roomName={roomName}
      isLoading={isLoading}
      messages={messages}
      roomId={roomId as string}
      sendMessage={sendMessage}
    />
  );
};

export default RoomPage;
