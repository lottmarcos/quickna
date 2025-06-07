import Image from 'next/image';
import { useRouter } from 'next/router';

import { Stack, Typography } from '@mui/material';
import { Button } from 'src/frontend/components';
import { useIsMobileUser } from 'src/frontend/hooks';

const NotFound = () => {
  const router = useRouter();
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
        Essa sala não existe!
      </Typography>
      <Image
        src="/assets/404.png"
        alt="Sala não existe"
        width={isMobileUser ? 200 : 400}
        height={isMobileUser ? 140 : 280}
      />
      <Button
        title="Voltar para o início"
        onClick={() => router.push('/')}
        variant="blue"
        size={isMobileUser ? 'medium' : 'large'}
      />
    </Stack>
  );
};

export default NotFound;
