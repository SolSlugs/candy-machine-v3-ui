import {
  PublicKey,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import { DigitalAssetWithToken, JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import React from 'react';
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
  }, [umi, checkEligibility, candyMachineId, firstRun, toast, setfirstRun]);

  return { candyMachine, candyGuard };


};

// Move PageContent outside and memoize it
const PageContent = React.memo(({ 
  loading, 
  candyMachine, 
  guards, 
  dialogText, 
  ownedTokens,
  setGuards,
  mintsCreated,
  setMintsCreated,
  onShowNftOpen,
  setCheckEligibility,
  umi,
  candyGuard,
  mintSuccess,
  setMintSuccess,
  setDialogText,
}: {
  loading: boolean;
  candyMachine: CandyMachine | undefined;
  guards: GuardReturn[];
  dialogText: string;
  ownedTokens: DigitalAssetWithToken[] | undefined;
  setGuards: Dispatch<SetStateAction<GuardReturn[]>>;
  mintsCreated: { mint: PublicKey, offChainMetadata: JsonMetadata | undefined }[] | undefined;
  setMintsCreated: Dispatch<SetStateAction<{ mint: PublicKey, offChainMetadata: JsonMetadata | undefined }[] | undefined>>;
  onShowNftOpen: () => void;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
  umi: Umi;
  candyGuard: CandyGuard | undefined;
  mintSuccess: boolean;
  setMintSuccess: Dispatch<SetStateAction<boolean>>;
  setDialogText: Dispatch<SetStateAction<string>>;
}) => {
  const total = Number(candyMachine?.data.itemsAvailable) || 0;
  const remaining = total - Number(candyMachine?.itemsRedeemed || 0);
  const percentage = ((remaining / total) * 100) || 0;

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="relative w-[512px] h-[512px] overflow-hidden rounded-lg border-4 border-primary">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url("${mintSuccess ? '/bloodmoon.png' : '/nightshift.png'}")`,
            imageRendering: 'pixelated'
          }}
        />
        
        <div className="relative h-full flex flex-col p-6">
          <div className="flex-grow">
            {!loading && (
              <div className="font-press-start text-[10px] text-primary mb-6">
                <div className="mb-2">AVAILABLE:</div>
                <div className="bg-black/80 border-2 border-primary p-2 rounded-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-black/50 h-4 rounded-sm overflow-hidden relative">
                      <div 
                        className="absolute top-0 bottom-0 bg-primary transition-all duration-500"
                        style={{ 
                          width: `calc(${percentage}% + 4px)`,
                          clipPath: `polygon(0 0, calc(100% - 4px) 0, 100% 100%, 0 100%)`
                        }}
                      />
                    </div>
                    <div className="flex-shrink-0 w-16 text-right">
                      {remaining}/{total}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-black/80 rounded-sm">
              {loading ? (
                <div className="font-press-start text-[10px] text-primary p-4">
                  <div className="mb-2">AVAILABLE:</div>
                  <div className="bg-black/80 border-2 border-primary p-2 rounded-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex-grow bg-black/50 h-4 rounded-sm overflow-hidden relative">
                        <div 
                          className="absolute top-0 bottom-0 bg-primary/50 animate-pulse"
                          style={{ 
                            width: 'calc(100% + 4px)',
                            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 100%, 0 100%)'
                          }}
                        />
                      </div>
                      <div className="flex-shrink-0 w-16 text-right opacity-50">
                        --/--
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ButtonList
                  guardList={guards}
                  candyMachine={candyMachine}
                  candyGuard={candyGuard}
                  umi={umi}
                  ownedTokens={ownedTokens}
                  setGuardList={setGuards}
                  mintsCreated={mintsCreated}
                  setMintsCreated={setMintsCreated}
                  onOpen={onShowNftOpen}
                  setCheckEligibility={setCheckEligibility}
                  setMintSuccess={setMintSuccess}
                  setDialogText={setDialogText}
                  mintSuccess={mintSuccess}
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 pb-6">
            <RetroDialog 
              text={dialogText}
              dialogKey="main-dialog"
              avatarSrc={mintSuccess ? "/wflz.png" : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

PageContent.displayName = 'PageContent';

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
  const [mintSuccess, setMintSuccess] = useState(false);
  const [dialogText, setDialogText] = useState("What's up?! You've reached the Sol Slugs Gen 4 mint. If you have a mint token, you can redeem it here for a badass gen 4 slug! The slugussy provides the liquidity so we're good to go.");
  const [dialogKey, setDialogKey] = useState('default');

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

  return (
    <main className="min-h-screen bg-background">
      {showIntro ? (
        <RetroIntro onIntroComplete={() => setShowIntro(false)} />
      ) : (
        <>
          <div className={styles.wallet}>
            <WalletMultiButtonDynamic />
          </div>

          <PageContent
            loading={loading}
            candyMachine={candyMachine}
            guards={guards}
            dialogText={dialogText}
            ownedTokens={ownedTokens}
            setGuards={setGuards}
            mintsCreated={mintsCreated}
            setMintsCreated={setMintsCreated}
            onShowNftOpen={onShowNftOpen}
            setCheckEligibility={setCheckEligibility}
            umi={umi}
            candyGuard={candyGuard}
            mintSuccess={mintSuccess}
            setMintSuccess={setMintSuccess}
            setDialogText={setDialogText}
          />

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
