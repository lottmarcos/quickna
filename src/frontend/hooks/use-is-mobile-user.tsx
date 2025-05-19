import { useMediaQuery } from '@mui/material';

const useIsMobileUser = () => {
  return useMediaQuery('(max-width:1024px)');
};

export { useIsMobileUser };
