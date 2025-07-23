import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { RoleProvider } from '../context/RoleContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RoleProvider>
      <Component {...pageProps} />
    </RoleProvider>
  );
}
