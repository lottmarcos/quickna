import { useCallback, useEffect, useState } from 'react';

import { Modal, Paper, Skeleton, Snackbar, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { MAIN, SECONDARY } from 'src/constants/colors';

import { useIsMobileUser } from '../hooks';

import { Button } from './button';

export type ShareRoomModalProps = {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
};

const ShareRoomModal = ({ isOpen, roomId, onClose }: ShareRoomModalProps) => {
  const isMobileUser = useIsMobileUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${isMobileUser ? '150x150' : '250x250'}&data="www.quickna.com.br/room/${roomId}"`;

  const copyLinkToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(`www.quickna.com.br/room/${roomId}`)
      .then(() => {
        setIsToastOpen(true);
      })
      .catch((error) => {
        console.error('Erro ao copiar o link:', error);
      });
  }, [roomId]);

  useEffect(() => {
    if (isOpen && roomId) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, roomId]);

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        aria-labelledby="share-room-title"
        aria-describedby="share-room-description"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobileUser ? 300 : 500,
            padding: 3,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            width="100%"
            textAlign="center"
            color={MAIN.BLUE}
          >
            Compartilhe essa sala!
          </Typography>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            marginTop={3}
            spacing={2}
          >
            {isLoading ? (
              <Skeleton
                variant="rounded"
                width={isMobileUser ? 150 : 250}
                height={isMobileUser ? 150 : 250}
              />
            ) : (
              <img
                src={qrUrl}
                alt="QR Code da sala"
                width={isMobileUser ? 150 : 250}
                height={isMobileUser ? 150 : 250}
                style={{ borderRadius: 8 }}
              />
            )}
          </Stack>
          <Typography
            variant="body1"
            textAlign="center"
            marginTop={2}
            fontWeight={600}
            color={MAIN.BLUE}
          >
            Ou copie o link abaixo:
          </Typography>
          <Typography
            textAlign="center"
            marginTop={2}
            sx={{
              fontSize: '0.875rem',
              padding: '4px',
              border: `1px solid ${MAIN.BLUE}`,
              borderRadius: '4px',
              wordBreak: 'break-all',
              backgroundColor: SECONDARY.GRAY,
              color: MAIN.GRAY,
            }}
          >
            {`www.quickna.com.br/room/${roomId}`}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            marginTop={1}
            spacing={1}
          ></Stack>
          <Stack
            direction="row"
            spacing={4}
            marginTop={3}
            justifyContent="space-between"
          >
            <Button
              variant="pink"
              title="Copiar link"
              onClick={copyLinkToClipboard}
            />
            <Button onClick={onClose} title="Voltar" variant="blue" />
          </Stack>
        </Paper>
      </Modal>
      <Snackbar
        open={isToastOpen}
        sx={{
          '.MuiPaper-root': {
            background: MAIN.GREEN,
            color: 'white',
            fontWeight: 600,
          },
        }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        autoHideDuration={6000}
        onClose={() => setIsToastOpen(false)}
        message="Link copiado para a área de transferência!"
      />
    </>
  );
};

export { ShareRoomModal };
