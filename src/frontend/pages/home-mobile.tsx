import Image from 'next/image';

import { ArrowRightAltRounded } from '@mui/icons-material';
import { Stack, styled, TextField, Typography } from '@mui/material';
import { BACKGROUND, MAIN } from 'src/constants/colors';
import { Button } from 'src/frontend/components';

const WaveDivider = styled(Stack)(() => ({
  width: '100%',
  minHeight: '120px',
  height: '100vw',
  backgroundImage: 'url(/assets/wave.svg)',
  backgroundSize: '100vw',
  backgroundPosition: '20% 0%',
  backgroundRepeat: 'no-repeat',
}));

export type HomeMobileProps = {
  inputValue?: string;
  isEnterButtonDisabled?: boolean;
  onInputChange?: (value: string) => void;
  onEnter?: () => void;
  onCreateRoom?: () => void;
};

const HomeMobile = ({
  inputValue,
  isEnterButtonDisabled,
  onCreateRoom,
  onEnter,
  onInputChange,
}: HomeMobileProps) => {
  return (
    <Stack
      alignItems="center"
      sx={{
        maxHeight: '100vh',
        backgroundImage: 'url(/assets/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'left',
        backgroundRepeat: 'no-repeat',
        paddingTop: '80px',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        width="100%"
        marginBottom="32px"
        sx={{ padding: '0 24px' }}
      >
        <Stack direction="row">
          <Image
            src="/assets/logo.png"
            alt="Quick&A"
            width={75}
            height={75}
            style={{ position: 'relative', top: '-6px' }}
          />
          <Typography
            variant="h6"
            color="white"
            fontWeight={600}
            sx={{ position: 'relative', left: '-30px' }}
          >
            Quick&A
          </Typography>
        </Stack>
        <Button title="Criar nova sala" onClick={onCreateRoom} variant="pink" />
      </Stack>
      <Stack width="100%" sx={{ padding: '0 24px', marginBottom: '16px' }}>
        <Typography variant="h5" color="white" fontWeight={600}>
          Praticidade para se conectar ao seu público
        </Typography>
      </Stack>
      <Stack justifyContent="space-between" width="100%">
        <Stack spacing={1} width="100%" sx={{ padding: '0 24px' }}>
          <Typography variant="body1" color="white">
            Uma solução simples e ágil para criar sessões de perguntas e
            respostas para eventos ao vivo.
          </Typography>
          <Typography variant="body1" color="white">
            Sem cadastros e sem barreiras.
          </Typography>
        </Stack>
      </Stack>
      <WaveDivider></WaveDivider>
      <Stack
        height="100vh"
        width="100%"
        sx={{ background: BACKGROUND.BLUE, paddingBottom: '80px' }}
      >
        <Stack width="100%" gap={2} sx={{ padding: '0 24px' }}>
          <Typography color={MAIN.BLUE} fontWeight={600} variant="h6">
            Entrar em uma sala já existente?
          </Typography>
          <TextField
            variant="outlined"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            color="none"
            label="Digite o código da sala:"
            value={inputValue}
            onChange={(e) => {
              onInputChange(e.target.value);
            }}
          />
          <Stack alignSelf="end">
            <Button
              title="Entrar na sala"
              addonAfter={
                <Stack marginLeft="4px">
                  <ArrowRightAltRounded />
                </Stack>
              }
              onClick={onEnter}
              disabled={isEnterButtonDisabled}
              variant="blue"
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default HomeMobile;
