import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { Stack, CircularProgress } from '@mui/material';
import { MAIN } from 'src/constants/colors';

type LoadingProps = {
  isExternalLoading?: boolean;
};
const Loading = ({ isExternalLoading }: LoadingProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  if (!isLoading && !isExternalLoading) return null;

  return (
    <Stack alignItems="center" justifyContent="center" height="400px">
      <CircularProgress sx={{ color: MAIN.PURPLE }} />
    </Stack>
  );
};

export { Loading };
