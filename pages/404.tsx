import Image from 'next/image';

import { Stack, Typography } from '@mui/material';
import { Button } from 'src/frontend/components';
import { useIsMobileUser } from 'src/frontend/hooks';

const Page404 = () => {
  const isMobileUser = useIsMobileUser();

  return (
    <Stack
      alignItems="center"
      padding={12}
      gap={12}
      sx={{
        height: '100vh',
        backgroundImage: 'url(/assets/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Typography
        variant={isMobileUser ? 'h4' : 'h2'}
        color="white"
        textAlign="center"
        fontWeight={500}
      >
        Página não existe!
      </Typography>
      <Image
        src="/assets/404.png"
        alt="Página não encontrada"
        width={isMobileUser ? 200 : 400}
        height={isMobileUser ? 140 : 280}
      />
      <Button
        title="Voltar para o início"
        onClick={() => window.location.replace('/')}
        variant="blue"
        size={isMobileUser ? 'medium' : 'large'}
      />
    </Stack>
  );
};

export default Page404;
