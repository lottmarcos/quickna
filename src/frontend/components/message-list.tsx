import { useMemo } from 'react';

import { Person2Outlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BACKGROUND, MAIN } from 'src/constants/colors';
import { SavedMessage } from 'src/constants/types';

import { useIsMobileUser } from '../hooks';

type MessageListProps = {
  messages: SavedMessage[];
  isInputExpanded: boolean;
};

const MessageList = ({ messages, isInputExpanded }: MessageListProps) => {
  const isMobileUser = useIsMobileUser();

  const maxHeight = useMemo(() => {
    if (isMobileUser) {
      return isInputExpanded ? 'calc(100vh - 422px)' : 'calc(100vh - 190px)';
    }

    return isInputExpanded ? 'calc(100vh - 453px)' : 'calc(100vh - 220px)';
  }, [isMobileUser, isInputExpanded]);

  if (messages.length === 0) {
    return (
      <Card marginTop="16px">
        <Typography
          fontSize="0.85rem"
          fontWeight={600}
          width="100%"
          textAlign="center"
          color={MAIN.BLUE}
        >
          Seja o primeiro a mandar uma mensagem!
        </Typography>
        <Typography textAlign="center">😄 💬</Typography>
      </Card>
    );
  }

  return (
    <ScrollableContainer marginTop="16px" height={maxHeight}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </ScrollableContainer>
  );
};

type MessageProps = {
  message: SavedMessage;
};
const Message = ({ message }: MessageProps) => {
  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" gap="8px">
          <Person2Outlined sx={{ color: MAIN.PINK }} />
          <Typography fontWeight={600} color={MAIN.BLUE}>
            {message.author || 'Anônimo'}
          </Typography>
        </Stack>
        <Typography fontSize="0.85rem" fontWeight={600} color={MAIN.GRAY}>
          {formatTime(message.createdAt)}
        </Typography>
      </Stack>
      <Typography
        sx={{
          marginTop: '16px',
          borderRadius: '8px',
          padding: '4px 8px',
          border: `1px solid ${MAIN.PURPLE}`,
          backgroundColor: BACKGROUND.BLUE,
          fontSize: '0.95rem',
        }}
      >
        {message.content}
      </Typography>
    </Card>
  );
};

const Card = styled(Stack)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  marginBottom: '16px',
  width: '100%',
}));

const ScrollableContainer = styled(Stack)({
  transition: 'height 0.3s ease-in-out',
  borderRadius: '8px',
  overflowY: 'auto',
  paddingRight: '8px',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: MAIN.BLUE,
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: MAIN.BLUE,
  },
});

export { MessageList };
