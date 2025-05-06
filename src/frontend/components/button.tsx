import { ReactNode } from 'react';

import { CircularProgress, Button as MUIButton } from '@mui/material';
import { alpha, styled } from '@mui/system';
import { MAIN } from 'src/constants/colors';

export type ButtonProps = {
  title: string;
  onClick: () => void;
  addonBefore?: ReactNode;
  addonAfter?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'pink' | 'blue';
  size?: 'medium' | 'large';
};

const ButtonBase = styled(MUIButton)(
  ({ isDisabled, baseColor }: { isDisabled: boolean; baseColor: string }) => ({
    color: 'white',
    textTransform: 'none',
    backgroundColor: baseColor,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    height: 'fit-content',
    width: 'fit-content',

    '&:disabled': {
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      color: 'rgba(0, 0, 0, 0.26)',
      cursor: 'not-allowed',
    },

    '&:hover': {
      backgroundColor: alpha(baseColor, 0.8),
    },

    '&:active': {
      backgroundColor: alpha(baseColor, 0.8),
    },
  })
);

const Button = ({
  title,
  onClick,
  addonBefore,
  addonAfter,
  disabled = false,
  loading = false,
  variant = 'pink',
  size = 'medium',
}: ButtonProps) => {
  const baseColor = variant === 'pink' ? MAIN.PINK : MAIN.BLUE;
  const sizeMap = {
    medium: {
      padding: '4px 8px',
      fontWeight: 600,
      fontSize: '14px',
      borderRadius: '8px',
    },
    large: {
      padding: '8px 16px',
      fontWeight: 600,
      fontSize: '16px',
      borderRadius: '8px',
    },
  };

  return (
    <ButtonBase
      onClick={onClick}
      baseColor={baseColor}
      isDisabled={disabled || loading}
      disabled={disabled || loading}
      sx={{ ...sizeMap[size] }}
    >
      {addonBefore && addonBefore}
      {loading ? (
        <CircularProgress
          size={sizeMap[size].fontSize}
          sx={{ color: 'white' }}
        />
      ) : (
        title
      )}
      {addonAfter && addonAfter}
    </ButtonBase>
  );
};

export { Button };
