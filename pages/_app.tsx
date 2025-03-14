import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useMemo } from "react";
import { UmiProvider } from "../utils/UmiProvider";
import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { headerText } from 'settings';
import { SolanaTimeProvider } from "@/utils/SolanaTimeContext";
import { ToastProvider } from '@/contexts/ToastContext';
import { AudioProvider } from '../contexts/AudioContext';
import { MuteButton } from '../components/MuteButton';

export default function App({ Component, pageProps }: AppProps) {
  let network = WalletAdapterNetwork.Devnet;
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "mainnet-beta" || process.env.NEXT_PUBLIC_ENVIRONMENT === "mainnet") {
    network = WalletAdapterNetwork.Mainnet;
  }
  let endpoint = "https://api.devnet.solana.com";
  if (process.env.NEXT_PUBLIC_RPC) {
    endpoint = process.env.NEXT_PUBLIC_RPC;
  }
  const wallets = useMemo(() => [], []);

  return (
    <>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={headerText} />
        <meta
          property="og:description"
          content="Sol Slugs Gen 4 Mint!"
        />
        <meta name="description" content="Sol Slugs Gen 4 Mint!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{headerText}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <WalletProvider wallets={wallets}>
        <UmiProvider endpoint={endpoint}>
          <AudioProvider>
            <WalletModalProvider>
              <SolanaTimeProvider>
                <ToastProvider>
                  <MuteButton />
                  <Component {...pageProps} />
                </ToastProvider>
              </SolanaTimeProvider>
            </WalletModalProvider>
          </AudioProvider>
        </UmiProvider>
      </WalletProvider>
    </>
  );
}
