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
  none,
  publicKey,
  signAllTransactions,
  sol,
  some,
  transactionBuilder,
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
  GuardButtonList,
  buildTx,
  getRequiredCU,
} from "../utils/mintHelper";
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import { verifyTx } from "@/utils/verifyTx";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { useToast } from "@/contexts/ToastContext";
import { Timer } from './Timer';
import { AddressLookupTableInput } from '@metaplex-foundation/mpl-toolbox';

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
  toast: ReturnType<typeof useToast>
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
    console.log("The Creator does not want to pay for MarkSackerbergs beer 😒");
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
            "error",
            900,
            true
          );
          return { status: "rejected", reason: error, value: new Uint8Array };

        });
        if (sig.status === "fulfilled")
          await verifyTx(umi, [sig.value], latestBlockhash, "finalized");

    }

    // fetch LUT
    let tables: AddressLookupTableInput[] = [];
    const lut = process.env.NEXT_PUBLIC_LUT;
    if (lut) {
      const lutPubKey = publicKey(lut);
      const fetchedLut = await fetchAddressLookupTable(umi, lutPubKey);
      tables = [fetchedLut];
    } else {
      toast.showToast(
        "The developer should really set a lookup table!",
        "warning",
        900,
        true
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
        .sendTransaction(tx, { skipPreflight:true, maxRetries: 1, preflightCommitment: "finalized", commitment: "finalized" })
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

    await Promise.allSettled(sendPromises);

    if (!(await sendPromises[0]).status === true) {
      // throw error that no tx was created
      throw new Error("no tx was created");
    }
    updateLoadingText(
      `finalizing transaction(s)`,
      guardList,
      guardToUse.label,
      setGuardList
    );

    toast.showToast(
      `${signedTransactions.length} Transaction(s) sent!`,
      "success",
      3000,
      true
    );
    
    const successfulMints = await verifyTx(umi, signatures, latestBlockhash, "finalized");

    updateLoadingText(
      "Fetching your NFT",
      guardList,
      guardToUse.label,
      setGuardList
    );

    // Filter out successful mints and map to fetch promises
    const fetchNftPromises = successfulMints.map((mintResult) =>
      fetchNft(umi, mintResult).then((nftData) => ({
        mint: mintResult,
        nftData,
      }))
    );

    const fetchedNftsResults = await Promise.all(fetchNftPromises);

    // Prepare data for setting mintsCreated
    let newMintsCreated: { mint: PublicKey; offChainMetadata: JsonMetadata }[] =
      [];
    fetchedNftsResults.map((acc) => {
      if (acc.nftData.digitalAsset && acc.nftData.jsonMetadata) {
        newMintsCreated.push({
          mint: acc.mint,
          offChainMetadata: acc.nftData.jsonMetadata,
        });
      }
      return acc;
    }, []);

    // Update mintsCreated only if there are new mints
    if (newMintsCreated.length > 0) {
        setMintsCreated(newMintsCreated);
        onOpen();
    }
  } catch (e) {
    console.error(`minting failed because of ${e}`);
    toast.showToast(
      "Your mint failed!",
      "error",
      900,
      true
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
}: Props): JSX.Element {
  const solanaTime = useSolanaTime();
  const [numberInputValues, setNumberInputValues] = useState<{
    [label: string]: number;
  }>({});
  const toast = useToast();

  if (!candyMachine || !candyGuard) {
    return <></>;
  }

  const handleNumberInputChange = (label: string, value: number) => {
    setNumberInputValues((prev) => ({ ...prev, [label]: value }));
  };

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
    const group = candyGuard.groups.find((elem) => elem.label === buttonGuard.label);
    
    return (
      <div key={index}>
        <div className="flex flex-col bg-widget/30 rounded-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-primary">
              {text ? text.header : "header missing in settings.tsx"}
            </h3>
            {buttonGuard.endTime > createBigInt(0) &&
              buttonGuard.endTime - solanaTime > createBigInt(0) && (
                <div className="flex items-center bg-accent/50 rounded-full px-4 py-1">
                  <span className="text-sm mr-2 text-white">Ending in: </span>
                  <Timer
                    toTime={buttonGuard.endTime}
                    solanaTime={solanaTime}
                    setCheckEligibility={setCheckEligibility}
                  />
                </div>
              )}
          </div>

          <p className="text-white/90 text-base mb-4 leading-relaxed">
            {text ? text.mintText : "mintText missing in settings.tsx"}
          </p>

          <div className="flex items-center justify-between mt-auto">
            {process.env.NEXT_PUBLIC_MULTIMINT && buttonGuard.allowed && (
              <div className="flex items-center gap-2">
                <label className="text-white/70 text-sm">Quantity:</label>
                <input
                  type="number"
                  value={numberInputValues[buttonGuard.label] || 1}
                  min={1}
                  max={buttonGuard.maxAmount < 1 ? 1 : buttonGuard.maxAmount}
                  onChange={(e) => handleNumberInputChange(buttonGuard.label, Number(e.target.value))}
                  className="w-20 px-3 py-2 text-sm bg-background border border-accent/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={!buttonGuard.allowed}
                />
              </div>
            )}
            
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
                toast
              )}
              disabled={!buttonGuard.allowed}
              className={`px-6 py-2.5 text-base font-semibold rounded-lg transition-all duration-200 transform hover:scale-105
                ${buttonGuard.allowed 
                  ? 'bg-primary hover:bg-accent text-background shadow-lg hover:shadow-xl' 
                  : 'bg-disabled/50 text-white/50 cursor-not-allowed'}`}
              title={buttonGuard.reason}
            >
              {guardList.find((elem) => elem.label === buttonGuard.label)?.minting ? (
                <div className="flex items-center gap-2">
                  <span>Minting...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent"></div>
                </div>
              ) : (
                text ? text.buttonLabel : "buttonLabel missing in settings.tsx"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  });

  return <>{listItems}</>;
}
