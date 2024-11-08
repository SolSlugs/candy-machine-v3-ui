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
import { image, headerText } from "../settings";
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import { useToast } from '@/contexts/ToastContext';
import { useDisclosure } from '@/hooks/useDisclosure';

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
  const { candyMachine, candyGuard } = useCandyMachine(umi, candyMachineId, checkEligibility, setCheckEligibility, firstRun, setFirstRun);

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-widget rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-accent">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">Sol Slugs Gen 4 Mint</h1>
              {!loading && (
                <div className="bg-accent rounded p-3">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-white">Available NFTs:</span>
                    <span className="font-semibold text-primary">
                      {Number(candyMachine?.data.itemsAvailable) - Number(candyMachine?.itemsRedeemed)}/
                      {Number(candyMachine?.data.itemsAvailable)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logo Section - adjusted positioning */}
          <div className="flex justify-center -mb-12">
            <img 
              src="/solslugs.png" 
              alt="Sol Slugs Logo" 
              className="h-24 w-24 transform -translate-y-12"
            />
          </div>

          {/* Body - reduced top padding */}
          <div className="pt-0 px-6 pb-6">
            <div>
              {loading ? (
                <div className="space-y-4">
                  <div className="h-8 bg-widget animate-pulse rounded"></div>
                  <div className="h-8 bg-widget animate-pulse rounded"></div>
                  <div className="h-8 bg-widget animate-pulse rounded"></div>
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
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <div className={styles.wallet}>
        <WalletMultiButtonDynamic />
      </div>

      <div className="p-4">
        <PageContent key="content" />
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
    </main>
  );
}
