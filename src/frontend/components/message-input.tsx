import React, { useState } from 'react';

import { ChatBubbleOutline, ChevronRight } from '@mui/icons-material';
import { Drawer, Stack, TextField, Typography } from '@mui/material';
import { MAIN } from 'src/constants/colors';

import { useIsMobileUser } from '../hooks';

import { Button } from './button';

type MessageInputProps = {
  onSendMessage: (content: string, author: string | null) => void;
};

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const isMobileUser = useIsMobileUser();
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = () => {
    if (!message.trim()) return;

    onSendMessage(message.trim(), author.trim() || null);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const onAuthorChange = (author: string) => {
    setAuthor(author);
  };
  const onMessageChange = (message: string) => {
    setMessage(message);
  };

  if (isMobileUser) {
    return (
      <Drawer
        open
        anchor="bottom"
        variant="permanent"
        sx={{
          '&& .MuiPaper-root': {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            width: '100%',
            margin: '0 1px',
            maxWidth: 'calc(100vw - 2px)',
            border: `1px solid ${MAIN.BLUE}`,
          },
        }}
      >
        <MessageInputs
          author={author}
          message={message}
          isExpanded={isExpanded}
          handleSubmit={handleSubmit}
          handleKeyPress={handleKeyPress}
          onAuthorChange={onAuthorChange}
          onMessageChange={onMessageChange}
          toggleExpand={() => setIsExpanded((prev) => !prev)}
        />
      </Drawer>
    );
  }

  return (
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginTop: '16px',
        width: '100%',
      })}
    >
      <MessageInputs
        author={author}
        message={message}
        isExpanded={isExpanded}
        handleSubmit={handleSubmit}
        handleKeyPress={handleKeyPress}
        onAuthorChange={onAuthorChange}
        onMessageChange={onMessageChange}
        toggleExpand={() => setIsExpanded((prev) => !prev)}
      />
    </Stack>
  );
};

type MessageInputsProps = {
  author: string;
  message: string;
  isExpanded: boolean;
  toggleExpand: () => void;
  handleSubmit: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  onAuthorChange: (author: string) => void;
  onMessageChange: (message: string) => void;
};

const MessageInputs = ({
  author,
  message,
  isExpanded,
  toggleExpand,
  handleSubmit,
  handleKeyPress,
  onAuthorChange,
  onMessageChange,
}: MessageInputsProps) => (
  <Stack padding="24px 16px">
    <Stack
      direction="row"
      justifyContent="space-between"
      onClick={toggleExpand}
    >
      <Stack direction="row" gap="16px">
        <ChatBubbleOutline
          sx={{ color: MAIN.PINK, cursor: 'pointer', fontSize: '2rem' }}
        />
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.15rem', color: MAIN.BLUE }}
        >
          Envie uma mensagem!
        </Typography>
      </Stack>
      <ChevronRight
        sx={{
          color: MAIN.PINK,
          cursor: 'pointer',
          fontSize: '2rem',
          justifySelf: 'end',
          rotate: isExpanded ? '90deg' : '270deg',
        }}
      />
    </Stack>
    {isExpanded && (
      <Stack padding="16px 0" gap="16px">
        <TextField
          variant="outlined"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          color="none"
          label="Digite o seu nome (opcional):"
          value={author}
          onChange={(e) => {
            onAuthorChange(e.target.value);
          }}
        />
        <TextField
          variant="outlined"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          color="none"
          label="Digite aqui sua mensagem:"
          value={message}
          onChange={(e) => {
            onMessageChange(e.target.value);
          }}
          onKeyPress={handleKeyPress}
        />
        <Stack
          direction="row"
          spacing={4}
          marginTop={3}
          justifyContent="flex-end"
        >
          <Button
            onClick={handleSubmit}
            title="Enviar"
            variant="pink"
            disabled={!message}
          />
        </Stack>
      </Stack>
    )}
  </Stack>
);

export { MessageInput };
