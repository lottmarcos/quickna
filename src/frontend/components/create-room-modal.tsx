import { useState } from 'react';

import { Modal, Paper, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { MAIN } from 'src/constants/colors';

import { useIsMobileUser } from '../hooks';

import { Button } from './button';

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (room: string) => void;
};

const CreateRoomModal = ({
  isOpen,
  onClose,
  onConfirm,
}: CreateRoomModalProps) => {
  const isMobileUser = useIsMobileUser();
  const [inputValue, setInputValue] = useState('');

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="create-room-title"
      aria-describedby="create-room-description"
    >
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobileUser ? 300 : 500,
          padding: 3,
          borderRadius: 4,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          width="100%"
          textAlign="center"
          color={MAIN.BLUE}
        >
          Crie uma sala
        </Typography>
        <Stack spacing={2} paddingY={3}>
          <Typography color={MAIN.BLUE}>Dê um nome para a sua sala.</Typography>
          <TextField
            variant="outlined"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            color="none"
            label="Digite o nome da sala:"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={4}
          marginTop={3}
          justifyContent="flex-end"
        >
          <Button onClick={onClose} title="Voltar" variant="blue" />
          <Button
            onClick={() => onConfirm(inputValue)}
            title="Confirmar criação"
            variant="pink"
          />
        </Stack>
      </Paper>
    </Modal>
  );
};

export { CreateRoomModal };
