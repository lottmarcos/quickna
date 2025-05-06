import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const useIsNextLoading = () => {
  const router = useRouter();
  const [isNextLoading, setIsNextLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsNextLoading(true);
    const handleComplete = () => setIsNextLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return isNextLoading;
};

export { useIsNextLoading };
