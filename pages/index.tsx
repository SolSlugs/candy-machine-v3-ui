import {
  PublicKey,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import { DigitalAssetWithToken, JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useUmi } from "../utils/useUmi";
import { fetchCandyMachine, safeFetchCandyGuard, CandyGuard, CandyMachine, AccountVersion } from "@metaplex-foundation/mpl-candy-machine"
import styles from "../styles/Home.module.css";
import { guardChecker } from "../utils/checkAllowed";
import {  Modal } from '@chakra-ui/react';
import { ButtonList } from "../components/mintButton";
import { GuardReturn } from "../utils/checkerHelper";
import { ShowNft } from "../components/showNft";
import { InitializeModal } from "../components/initializeModal";
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import { useToast } from '@/contexts/ToastContext';
import { useDisclosure } from '@/hooks/useDisclosure';
import { RetroIntro } from "../components/RetroIntro";
import { RetroDialog } from "../components/RetroDialog";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const useCandyMachine = (
  umi: Umi,
  candyMachineId: string,
  checkEligibility: boolean,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>,
  firstRun: boolean,
  setfirstRun: Dispatch<SetStateAction<boolean>>
) => {
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [candyGuard, setCandyGuard] = useState<CandyGuard>();
  const toast = useToast();


  useEffect(() => {
    (async () => {
      if (checkEligibility) {
        if (!candyMachineId) {
          console.error("No candy machine in .env!");
          toast.showToast(
            "No candy machine in .env!",
            "error",
            "Add your candy machine address to the .env file!"
          );
          return;
        }

        let candyMachine;
        try {
          candyMachine = await fetchCandyMachine(umi, publicKey(candyMachineId));
          //verify CM Version
          if (candyMachine.version != AccountVersion.V2){
            toast.showToast(
              "Wrong candy machine account version!",
              "error",
              "Please use latest sugar to create your candy machine. Need Account Version 2!"
            );
            return;
          }
        } catch (e) {
          console.error(e);
          toast.showToast(
            "The CM from .env is invalid",
            "error",
            "Are you using the correct environment?"
          );
        }
        setCandyMachine(candyMachine);
        if (!candyMachine) {
          return;
        }
        let candyGuard;
        try {
          candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
        } catch (e) {
          console.error(e);
          toast.showToast(
            "No Candy Guard found!",
            "error",
            "Do you have one assigned?"
          );
        }
        if (!candyGuard) {
          return;
        }
        setCandyGuard(candyGuard);
        if (firstRun){
          setfirstRun(false)
        }
      }
    })();
  }, [umi, checkEligibility]);

  return { candyMachine, candyGuard };


};


export default function Home() {
  const umi = useUmi();
  const solanaTime = useSolanaTime();
  const toast = useToast();
  const { isOpen: isShowNftOpen, onOpen: onShowNftOpen, onClose: onShowNftClose } = useDisclosure();
  const { isOpen: isInitializerOpen, onOpen: onInitializerOpen, onClose: onInitializerClose } = useDisclosure();
  const [mintsCreated, setMintsCreated] = useState<{ mint: PublicKey, offChainMetadata: JsonMetadata | undefined }[] | undefined>();
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [ownedTokens, setOwnedTokens] = useState<DigitalAssetWithToken[]>();
  const [guards, setGuards] = useState<GuardReturn[]>([
    { label: "startDefault", allowed: false, maxAmount: 0 },
  ]);
  const [firstRun, setFirstRun] = useState(true);
  const [checkEligibility, setCheckEligibility] = useState<boolean>(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
      toast.showToast(
        "No candy machine in .env!",
        "error",
        "Add your candy machine address to the .env file!"
      );
    }
  }, [toast]);

  const candyMachineId: PublicKey = useMemo(() => {
    if (process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
      return publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
    } else {
      console.error(`NO CANDY MACHINE IN .env FILE DEFINED!`);
      toast.showToast(
        "No candy machine in .env!",
        "error",
        "Add your candy machine address to the .env file!"
      );
      return publicKey("11111111111111111111111111111111");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { candyMachine, candyGuard } = useCandyMachine(
    umi, 
    candyMachineId, 
    checkEligibility, 
    setCheckEligibility, 
    firstRun, 
    setFirstRun
  );

  useEffect(() => {
    const checkEligibilityFunc = async () => {
      if (!candyMachine || !candyGuard || !checkEligibility || isShowNftOpen) {
        return;
      }
      setFirstRun(false);
      
      const { guardReturn, ownedTokens } = await guardChecker(
        umi, candyGuard, candyMachine, solanaTime
      );

      setOwnedTokens(ownedTokens);
      setGuards(guardReturn);
      setIsAllowed(false);

      let allowed = false;
      for (const guard of guardReturn) {
        if (guard.allowed) {
          allowed = true;
          break;
        }
      }

      setIsAllowed(allowed);
      setLoading(false);
    };

    checkEligibilityFunc();
    // On purpose: not check for candyMachine, candyGuard, solanaTime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [umi, checkEligibility, firstRun]);

  const PageContent = () => {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="relative w-[512px] h-[512px] overflow-hidden rounded-lg border-4 border-primary">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: 'url("/nightshift.png")',
              imageRendering: 'pixelated'
            }}
          />
          
          <div className="relative h-full flex flex-col p-6">
            <div className="flex-grow">
              {!loading && (
                <div className="font-press-start text-xs text-primary mb-6">
                  Available: {Number(candyMachine?.data.itemsAvailable) - Number(candyMachine?.itemsRedeemed)}/
                  {Number(candyMachine?.data.itemsAvailable)}
                </div>
              )}

              {loading ? (
                <div className="h-8 bg-widget/50 animate-pulse rounded-sm" />
              ) : (
                <button
                  onClick={() => {
                    // Your mint logic here
                  }}
                  className="w-full font-press-start text-xs bg-black/80 hover:bg-black/60 text-primary border-2 border-primary px-4 py-2 rounded-sm transition-colors duration-200"
                >
                  MINT NOW
                </button>
              )}
            </div>

            <div className="flex-shrink-0 pb-6">
              <RetroDialog 
                text="What's up?! You've reached the Sol Slugs Gen 4 mint, dude. If you have a mint token, you can redeem it here for a badass gen 4 slug! The slugussy provides the liquidity so we're good to go."
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      {showIntro ? (
        <RetroIntro onIntroComplete={() => setShowIntro(false)} />
      ) : (
        <>
          <div className={styles.wallet}>
            <WalletMultiButtonDynamic />
          </div>

          <div className="p-4">
            <PageContent key="content" />
          </div>

          {/* Replay Intro Button */}
          <div className="fixed bottom-4 right-4">
            <button
              onClick={() => setShowIntro(true)}
              className="bg-widget hover:bg-accent text-primary px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 font-press-start text-sm"
            >
              Replay Intro
            </button>
          </div>

          {/* NFT Display Modal */}
          <Modal 
            isOpen={isShowNftOpen} 
            onClose={onShowNftClose}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium text-primary">Your minted NFT:</h2>
            </div>
            <ShowNft nfts={mintsCreated} />
          </Modal>

          {/* Initializer Modal */}
          {umi.identity.publicKey === candyMachine?.authority && (
            <>
              <div className="flex justify-center mt-10">
                <button
                  onClick={onInitializerOpen}
                  className="bg-incinerator hover:bg-scorcher text-white px-4 py-2 rounded"
                >
                  Initialize Everything!
                </button>
              </div>
              <Modal
                isOpen={isInitializerOpen}
                onClose={onInitializerClose}
              >
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-primary">Initializer</h2>
                </div>
                <InitializeModal
                  umi={umi}
                  candyMachine={candyMachine}
                  candyGuard={candyGuard}
                />
              </Modal>
            </>
          )}
        </>
      )}
    </main>
  );
}
