import { useState } from 'react';

import { CreateRoomModal } from 'src/frontend/components';
import { useIsMobileUser, useIsNextLoading } from 'src/frontend/hooks';
import { HomeMobile, HomeWeb } from 'src/frontend/pages';

const Index = () => {
  const isNextLoading = useIsNextLoading();
  const isMobile = useIsMobileUser();
  const [room, setRoom] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEnterButtonDisabled = room.length === 0 || isNextLoading;

  const onCreateRoom = () => setIsModalOpen(true);

  return (
    <>
      {isMobile ? (
        <HomeMobile
          inputValue={room}
          isEnterButtonDisabled={isEnterButtonDisabled}
          onInputChange={setRoom}
          onCreateRoom={onCreateRoom}
        />
      ) : (
        <HomeWeb
          inputValue={room}
          isEnterButtonDisabled={isEnterButtonDisabled}
          onInputChange={setRoom}
          onCreateRoom={onCreateRoom}
        />
      )}
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(room) => window.alert(`nome da sala: ${room}`)}
      />
    </>
  );
};

export default Index;
