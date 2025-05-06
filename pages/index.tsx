import { useState } from 'react';

import { useIsMobileUser, useIsNextLoading } from 'src/frontend/hooks';
import { HomeMobile, HomeWeb } from 'src/frontend/pages';

const Index = () => {
  const isNextLoading = useIsNextLoading();
  const isMobile = useIsMobileUser();
  const [room, setRoom] = useState('');

  const isEnterButtonDisabled = room.length === 0 || isNextLoading;

  return isMobile ? (
    <HomeMobile
      inputValue={room}
      onInputChange={setRoom}
      isEnterButtonDisabled={isEnterButtonDisabled}
    />
  ) : (
    <HomeWeb
      inputValue={room}
      onInputChange={setRoom}
      isEnterButtonDisabled={isEnterButtonDisabled}
    />
  );
};

export default Index;
