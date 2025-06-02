import { useRouter } from 'next/router';
import { useState } from 'react';

import { Snackbar } from '@mui/material';
import { MAIN } from 'src/constants/colors';
import { CreateRoomSuccessResponse } from 'src/constants/types';
import { http } from 'src/frontend/api/http';
import { CreateRoomModal } from 'src/frontend/components';
import { useIsMobileUser, useIsNextLoading } from 'src/frontend/hooks';
import { HomeMobile, HomeWeb } from 'src/frontend/pages';

const Index = () => {
  const router = useRouter();
  const isNextLoading = useIsNextLoading();
  const isMobile = useIsMobileUser();
  const [room, setRoom] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [message, setMessage] = useState('');

  const isEnterButtonDisabled = room.length === 0 || isNextLoading;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const createRoom = (name: string) => {
    http
      .post('api/v1/room', { name })
      .then((response: CreateRoomSuccessResponse) => {
        if (response.success && response.id) {
          return router.push(`/room/${response.id}`);
        } else {
          setIsToastOpen(true);
          setMessage('Erro ao criar sala.');
        }
      })
      .catch(() => {
        setIsToastOpen(true);
        setMessage('Erro ao criar sala.');
      });
  };

  const onEnter = () => {
    http
      .get(`api/v1/room?room=${room}`)
      .then((response) => {
        if (response.success && response.room) {
          return router.push(`/room/${response.room.id}`);
        } else {
          setIsToastOpen(true);
          setMessage('Sala não encontrada.');
        }
      })
      .catch(() => {
        setIsToastOpen(true);
        setMessage('Erro ao entrar na sala.');
      });
  };

  return (
    <>
      {isMobile ? (
        <HomeMobile
          inputValue={room}
          isEnterButtonDisabled={isEnterButtonDisabled}
          onInputChange={setRoom}
          onCreateRoom={openModal}
          onEnter={onEnter}
        />
      ) : (
        <HomeWeb
          inputValue={room}
          isEnterButtonDisabled={isEnterButtonDisabled}
          onInputChange={setRoom}
          onCreateRoom={openModal}
          onEnter={onEnter}
        />
      )}
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={createRoom}
      />
      <Snackbar
        open={isToastOpen}
        sx={{
          '.MuiPaper-root': {
            background: MAIN.RED,
            color: 'white',
            fontWeight: 600,
          },
        }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        autoHideDuration={6000}
        onClose={() => setIsToastOpen(false)}
        message={message}
      />
    </>
  );
};

export default Index;
