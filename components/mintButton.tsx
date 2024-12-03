import {
  CandyGuard,
  CandyMachine,
  mintV2,
} from "@metaplex-foundation/mpl-candy-machine";
import { GuardReturn } from "../utils/checkerHelper";
import {
  KeypairSigner,
  PublicKey,
  Transaction,
  Umi,
  createBigInt,
  generateSigner,
  publicKey,
  signAllTransactions,
} from "@metaplex-foundation/umi";
import {
  DigitalAsset,
  DigitalAssetWithToken,
  JsonMetadata,
  fetchDigitalAsset,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { mintText } from "../settings";
import { fetchAddressLookupTable, setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox";
import { Dispatch, SetStateAction, useState } from "react";
import {
  chooseGuardToUse,
  routeBuilder,
  mintArgsBuilder,
  buildTx,
  getRequiredCU,
} from "../utils/mintHelper";
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import { verifyTx } from "@/utils/verifyTx";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { useToast } from "@/contexts/ToastContext";
import { Timer } from './Timer';
import { AddressLookupTable } from '@metaplex-foundation/mpl-toolbox';

const updateLoadingText = (
  loadingText: string | undefined,
  guardList: GuardReturn[],
  label: string,
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>
) => {
  const guardIndex = guardList.findIndex((g) => g.label === label);
  if (guardIndex === -1) {
    console.error("guard not found");
    return;
  }
  const newGuardList = [...guardList];
  newGuardList[guardIndex].loadingText = loadingText;
  setGuardList(newGuardList);
};

const fetchNft = async (
  umi: Umi,
  nftAdress: PublicKey,
  toast: ReturnType<typeof useToast>
) => {
  let digitalAsset: DigitalAsset | undefined;
  let jsonMetadata: JsonMetadata | undefined;
  try {
    digitalAsset = await fetchDigitalAsset(umi, nftAdress);
    jsonMetadata = await fetchJsonMetadata(umi, digitalAsset.metadata.uri);
  } catch (e) {
    console.error(e);
    toast.showToast(
      "Nft could not be fetched!",
      "info",
      "Please check your Wallet instead."
    );
  }

  return { digitalAsset, jsonMetadata };
};

const mintClick = async (
  umi: Umi,
  guard: GuardReturn,
  candyMachine: CandyMachine,
  candyGuard: CandyGuard,
  ownedTokens: DigitalAssetWithToken[],
  mintAmount: number,
  mintsCreated:
    | {
        mint: PublicKey;
        offChainMetadata: JsonMetadata | undefined;
      }[]
    | undefined,
  setMintsCreated: Dispatch<
    SetStateAction<
      | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
      | undefined
    >
  >,
  guardList: GuardReturn[],
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>,
  onOpen: () => void,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>,
  toast: ReturnType<typeof useToast>,
  setMintSuccess: Dispatch<SetStateAction<boolean>>,
  setDialogText: Dispatch<SetStateAction<string>>,
  mintSuccess: boolean,
  setDialogKey: Dispatch<SetStateAction<number>>
) => {
  const guardToUse = chooseGuardToUse(guard, candyGuard);
  if (!guardToUse.guards) {
    console.error("no guard defined!");
    return;
  }

  let buyBeer = true;
  console.log("buyBeer",process.env.NEXT_PUBLIC_BUYMARKBEER )

  if (process.env.NEXT_PUBLIC_BUYMARKBEER  === "false") {
    buyBeer = false;
  }

  try {
    //find the guard by guardToUse.label and set minting to true
    const guardIndex = guardList.findIndex((g) => g.label === guardToUse.label);
    if (guardIndex === -1) {
      console.error("guard not found");
      return;
    }
    const newGuardList = [...guardList];
    newGuardList[guardIndex].minting = true;
    setGuardList(newGuardList);

    let routeBuild = await routeBuilder(umi, guardToUse, candyMachine);
    if (routeBuild && routeBuild.items.length > 0) {
      toast.showToast(
        "Allowlist detected. Please sign to be approved to mint.",
        "info"
      );
      routeBuild = routeBuild.prepend(setComputeUnitPrice(umi, { microLamports: parseInt(process.env.NEXT_PUBLIC_MICROLAMPORTS ?? "1001") }));
      const latestBlockhash = await umi.rpc.getLatestBlockhash({commitment: "finalized"});
      routeBuild = routeBuild.setBlockhash(latestBlockhash)
      const builtTx = await routeBuild.buildAndSign(umi);
      const sig = await umi.rpc
        .sendTransaction(builtTx, { skipPreflight:true, maxRetries: 1, preflightCommitment: "finalized", commitment: "finalized" })
        .then((signature) => {
          return { status: "fulfilled", value: signature };
        })
        .catch((error) => {
          toast.showToast(
            "Allow List TX failed!",
            "error"
          );
          return { status: "rejected", reason: error, value: new Uint8Array };
        });
        if (sig.status === "fulfilled")
          await verifyTx(umi, [sig.value], latestBlockhash, "finalized");
    }

    // fetch LUT
    let tables: AddressLookupTable[] = [];
    const lut = process.env.NEXT_PUBLIC_LUT;
    if (lut) {
      const lutPubKey = publicKey(lut);
      const fetchedLut = await fetchAddressLookupTable(umi, lutPubKey);
      tables = [fetchedLut];
    } else {
      toast.showToast(
        "The developer should really set a lookup table!",
        "warning"
      );
    }

    const mintTxs: Transaction[] = [];
    let nftsigners = [] as KeypairSigner[];

    const latestBlockhash = (await umi.rpc.getLatestBlockhash({commitment: "finalized"}));
    
    const mintArgs = mintArgsBuilder(candyMachine, guardToUse, ownedTokens);
    const nftMint = generateSigner(umi);
    const txForSimulation = buildTx(
      umi,
      candyMachine,
      candyGuard,
      nftMint,
      guardToUse,
      mintArgs,
      tables,
      latestBlockhash,
      1_400_000,
      buyBeer
    );
    const requiredCu = await getRequiredCU(umi, txForSimulation);

    for (let i = 0; i < mintAmount; i++) {
      const nftMint = generateSigner(umi);
      nftsigners.push(nftMint);
      const transaction = buildTx(
        umi,
        candyMachine,
        candyGuard,
        nftMint,
        guardToUse,
        mintArgs,
        tables,
        latestBlockhash,
        requiredCu,
        buyBeer
      );
      console.log(transaction)
      mintTxs.push(transaction);
    }
    if (!mintTxs.length) {
      console.error("no mint tx built!");
      return;
    }

    updateLoadingText(`Please sign`, guardList, guardToUse.label, setGuardList);
    const signedTransactions = await signAllTransactions(
      mintTxs.map((transaction, index) => ({
        transaction,
        signers: [umi.payer, nftsigners[index]],
      }))
    );

    let signatures: Uint8Array[] = [];
    let amountSent = 0;
    
    const sendPromises = signedTransactions.map((tx, index) => {
      return umi.rpc
        .sendTransaction(tx, { skipPreflight:true, maxRetries: 10, preflightCommitment: "confirmed", commitment: "confirmed" })
        .then((signature) => {
          console.log(
            `Transaction ${index + 1} resolved with signature: ${
              base58.deserialize(signature)[0]
            }`
          );
          amountSent = amountSent + 1;
          signatures.push(signature);
          return { status: "fulfilled", value: signature };
        })
        .catch((error) => {
          console.error(`Transaction ${index + 1} failed:`, error);
          return { status: "rejected", reason: error };
        });
    });

    const results =await Promise.allSettled(sendPromises);

    // check if all txs are successful
    const allSuccessful = results.every((result) => result.status === "fulfilled");

    if (!allSuccessful) {
      toast.showToast("Minting failed!", "error");
      return;
    }

    // Force a rerender by toggling mintSuccess and incrementing the key
    setMintSuccess(false);
    setTimeout(() => {
      setMintSuccess(true);
      setDialogKey(prev => prev + 1);
      if (mintSuccess) {
        setDialogText("You just minted another gen 4. Hell yeah!");
      } else {
        setDialogText("Congratulations! Your mint was successful. Welcome to Gen 4 brother.");
      }
    }, 50);

    toast.showToast(
      `${signedTransactions.length} Slug Minted!`,
      "success"
    );

  } catch (e) {
    console.error(`minting failed because of ${e}`);
    toast.showToast(
      "Your mint failed!",
      "error"
    );
  } finally {
    //find the guard by guardToUse.label and set minting to true
    const guardIndex = guardList.findIndex((g) => g.label === guardToUse.label);
    if (guardIndex === -1) {
      console.error("guard not found");
      return;
    }
    const newGuardList = [...guardList];
    newGuardList[guardIndex].minting = false;
    setGuardList(newGuardList);
    setCheckEligibility(true);
    updateLoadingText(undefined, guardList, guardToUse.label, setGuardList);
  }
};

type Props = {
  umi: Umi;
  guardList: GuardReturn[];
  candyMachine: CandyMachine | undefined;
  candyGuard: CandyGuard | undefined;
  ownedTokens: DigitalAssetWithToken[] | undefined;
  setGuardList: Dispatch<SetStateAction<GuardReturn[]>>;
  mintsCreated:
    | {
        mint: PublicKey;
        offChainMetadata: JsonMetadata | undefined;
      }[]
    | undefined;
  setMintsCreated: Dispatch<
    SetStateAction<
      | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
      | undefined
    >
  >;
  onOpen: () => void;
  setCheckEligibility: Dispatch<SetStateAction<boolean>>;
  setMintSuccess: Dispatch<SetStateAction<boolean>>;
  setDialogText: Dispatch<SetStateAction<string>>;
  mintSuccess: boolean;
  setDialogKey: Dispatch<SetStateAction<number>>;
};

export function ButtonList({
  umi,
  guardList,
  candyMachine,
  candyGuard,
  ownedTokens = [],
  setGuardList,
  mintsCreated,
  setMintsCreated,
  onOpen,
  setCheckEligibility,
  setMintSuccess,
  setDialogText,
  mintSuccess,
  setDialogKey,
}: Props): JSX.Element {
  const solanaTime = useSolanaTime();
  const [numberInputValues, setNumberInputValues] = useState<{
    [label: string]: number;
  }>({});
  const toast = useToast();

  if (!candyMachine || !candyGuard) {
    return <></>;
  }

  const isWalletConnected = umi.identity.publicKey !== publicKey("11111111111111111111111111111111");

  let filteredGuardlist = guardList.filter(
    (elem, index, self) =>
      index === self.findIndex((t) => t.label === elem.label)
  );
  
  if (filteredGuardlist.length === 0) {
    return <></>;
  }
  
  if (filteredGuardlist.length > 1) {
    filteredGuardlist = guardList.filter((elem) => elem.label != "default");
  }

  const listItems = filteredGuardlist.map((buttonGuard, index) => {
    const text = mintText.find((elem) => elem.label === buttonGuard.label);
    
    return (
      <div key={index} className="w-full space-y-2">
        {!isWalletConnected ? (
          <button
            disabled
            className="w-full font-press-start text-xs bg-black/80 text-primary/50 border-2 border-primary/50 px-4 py-2 rounded-sm"
          >
            CONNECT WALLET
          </button>
        ) : (
          <>
            <button
              onClick={() => mintClick(
                umi,
                buttonGuard,
                candyMachine,
                candyGuard,
                ownedTokens,
                numberInputValues[buttonGuard.label] || 1,
                mintsCreated,
                setMintsCreated,
                guardList,
                setGuardList,
                onOpen,
                setCheckEligibility,
                toast,
                setMintSuccess,
                setDialogText,
                mintSuccess,
                setDialogKey
              )}
              disabled={!buttonGuard.allowed}
              className={`w-full font-press-start text-xs px-4 py-2 rounded-sm transition-colors duration-200
                ${buttonGuard.allowed 
                  ? 'bg-black/80 hover:bg-black/60 text-primary border-2 border-primary' 
                  : 'bg-black/80 text-primary/50 border-2 border-primary/50 cursor-not-allowed'}`}
              title={buttonGuard.reason}
            >
              {guardList.find((elem) => elem.label === buttonGuard.label)?.minting ? (
                <span>MINTING...</span>
              ) : (
                "MINT NOW"
              )}
            </button>
            
            {/* Error Message */}
            {!buttonGuard.allowed && isWalletConnected && (
              <div className="font-press-start text-[10px] text-incinerator/70 text-center px-2">
                No mint tokens found in wallet
              </div>
            )}
          </>
        )}
      </div>
    );
  });

  return <>{listItems}</>;
}
