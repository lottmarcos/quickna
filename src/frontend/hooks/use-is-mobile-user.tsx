import { useMediaQuery } from '@mui/material';

const useIsMobileUser = () => {
  return useMediaQuery('(max-width:700px)');
};

export { useIsMobileUser };
