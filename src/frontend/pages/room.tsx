import { useRouter } from 'next/router';
import { useState } from 'react';

import { HomeOutlined, ShareOutlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { BACKGROUND, MAIN, SECONDARY } from 'src/constants/colors';
import { SavedMessage } from 'src/constants/types';

import {
  Loading,
  MessageInput,
  MessageList,
  ShareRoomModal,
} from '../components';
import { useIsMobileUser } from '../hooks';

export type RoomProps = {
  isLoading?: boolean;
  roomName: string;
  roomId: string;
  messages: SavedMessage[];
  sendMessage: (content: string, author: string | null) => void;
};

const Room = ({
  roomId,
  messages,
  roomName,
  isLoading = false,
  sendMessage,
}: RoomProps) => {
  const router = useRouter();
  const isMobileUser = useIsMobileUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(true);

  if (isLoading || !roomName)
    return (
      <Stack
        sx={{
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: BACKGROUND.BLUE,
        }}
      >
        <Loading isExternalLoading={isLoading} />
      </Stack>
    );

  return (
    <Stack
      sx={{
        height: '100vh',
        width: '100vw',
        padding: `32px ${isMobileUser ? '16px' : ' 15%'}`,
        backgroundColor: BACKGROUND.BLUE,
        justifyContent: 'space-between',
      }}
    >
      <Stack>
        <Stack
          sx={{
            width: '100%',
            padding: '4px 16px',
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: SECONDARY.BLUE,
            borderRadius: '8px',
          }}
        >
          <Typography
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: MAIN.BLUE,
              fontWeight: 600,
              fontSize: '1.5rem',
            }}
          >
            {roomName}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <HomeOutlined
              sx={{ color: MAIN.PURPLE, cursor: 'pointer', fontSize: '2rem' }}
              onClick={() => router.push('/')}
            />
            <ShareOutlined
              sx={{ color: MAIN.PURPLE, cursor: 'pointer', fontSize: '1.5rem' }}
              onClick={() => setIsModalOpen(true)}
            />
          </Stack>
        </Stack>
        <MessageList messages={messages} isInputExpanded={isInputExpanded} />
      </Stack>
      <MessageInput
        onSendMessage={sendMessage}
        isInputExpanded={isInputExpanded}
        toggleInputExpand={() => setIsInputExpanded((prev) => !prev)}
      />
      <ShareRoomModal
        roomId={roomId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Stack>
  );
};

export default Room;
