import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { CircularProgress, Stack } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { useIsNextLoading } from 'src/frontend/hooks';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const theme = useTheme();
  const router = useRouter();
  const isNextLoading = useIsNextLoading();

  const url = process.env.NEXT_PUBLIC_URL || 'https://quickna.com.br';
  const canonical = url + (router.asPath === '/' ? '' : router.asPath);
  const description = '';

  return (
    <>
      <Head>
        <title>Quick&A</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content="Quick & A" />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${url}/assets/logo.png`} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Quick & A" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${url}/assets/logo.png`} />

        <meta name="robots" content="index, follow" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isNextLoading ? (
          <Stack alignItems="center" justifyContent="center" flex={1}>
            <CircularProgress />
          </Stack>
        ) : (
          <Component {...pageProps} />
        )}
      </ThemeProvider>
    </>
  );
};

export default MyApp;
