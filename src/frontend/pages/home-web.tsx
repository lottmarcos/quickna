import Image from 'next/image';

import { ArrowRightAltRounded } from '@mui/icons-material';
import { Stack, styled, TextField, Typography } from '@mui/material';
import { MAIN } from 'src/constants/colors';
import { Button } from 'src/frontend/components';

const WaveDivider = styled(Stack)(() => ({
  width: '100%',
  height: '100vh',
  backgroundImage: 'url(/assets/wave.svg)',
  backgroundSize: 'cover',
}));

export type HomeWebProps = {
  inputValue?: string;
  isEnterButtonDisabled?: boolean;
  onInputChange?: (value: string) => void;
  onEnter?: () => void;
  onCreateRoom?: () => void;
};

const HomeWeb = ({
  inputValue,
  isEnterButtonDisabled,
  onCreateRoom,
  onEnter,
  onInputChange,
}: HomeWebProps) => {
  return (
    <Stack
      alignItems="center"
      sx={{
        backgroundImage: 'url(/assets/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'left',
        backgroundRepeat: 'no-repeat',
        paddingTop: '80px',
        maxHeight: '100vh',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        width="100%"
        marginBottom="16px"
        sx={{ padding: '0 60px' }}
      >
        <Stack direction="row">
          <Image
            src="/assets/logo.png"
            alt="Quick&A"
            width={150}
            height={150}
            style={{ position: 'relative', top: '-12px' }}
          />
          <Typography
            variant="h3"
            color="white"
            fontWeight={600}
            sx={{ position: 'relative', left: '-60px' }}
          >
            Quick&A
          </Typography>
        </Stack>
        <Button
          title="Criar nova sala"
          onClick={onCreateRoom}
          variant="pink"
          size="large"
        />
      </Stack>
      <Stack spacing={2} width="100%" sx={{ padding: '0 60px' }}>
        <Typography variant="h4" color="white" fontWeight={600}>
          Praticidade para se conectar ao seu público
        </Typography>
      </Stack>
      <WaveDivider>
        <Stack direction="row" justifyContent="space-between" width="100%">
          <Stack
            spacing={2}
            width="100%"
            sx={{
              paddingY: '24px',
              marginLeft: '64px',
              paddingRight: '24px',
            }}
          >
            <Typography variant="body1" color="white">
              Uma solução simples e ágil para criar
              <br />
              sessões de perguntas e respostas para eventos ao vivo.
            </Typography>
            <Typography variant="body1" color="white">
              Sem cadastros,
              <br /> sem barreiras.
            </Typography>
          </Stack>
          <Stack width="100%" gap={2} sx={{ padding: '148px 60px 0 0' }}>
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
      </WaveDivider>
    </Stack>
  );
};

export default HomeWeb;
