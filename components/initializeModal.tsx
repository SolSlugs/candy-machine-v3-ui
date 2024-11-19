import { createLutForCandyMachineAndGuard } from "../utils/createLutForCandyGuard";
import {
  CandyGuard,
  CandyMachine,
  getMerkleRoot,
  route,
} from "@metaplex-foundation/mpl-candy-machine";
import {
  Umi,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  transferSol,
  addMemo,
  setComputeUnitPrice,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import React, { useEffect, useState } from "react";
import { allowLists } from "@/allowlist";
import { getRequiredCU } from "@/utils/mintHelper";
import { useToast } from '@/contexts/ToastContext';

type Props = {
  umi: Umi;
  candyMachine: CandyMachine;
  candyGuard: CandyGuard | undefined;
};

// Function to create LUT
const createLut = (
  umi: Umi,
  candyMachine: CandyMachine,
  candyGuard: CandyGuard,
  recentSlot: number
) => async () => {
  let [builder, AddressLookupTableInput] = await createLutForCandyMachineAndGuard(
    umi,
    recentSlot,
    candyMachine,
    candyGuard
  );
  try {
    const latestBlockhash = (await umi.rpc.getLatestBlockhash()).blockhash;
    builder = builder.setBlockhash(latestBlockhash);
    builder = builder.prepend(
      setComputeUnitPrice(umi, { microLamports: parseInt(process.env.NEXT_PUBLIC_MICROLAMPORTS ?? "1001") })
    );
    const requiredCu = await getRequiredCU(umi, builder.build(umi));
    builder = builder.prepend(setComputeUnitLimit(umi, { units: requiredCu }));
    await builder.sendAndConfirm(umi, {
      confirm: { commitment: "processed" },
      send: { skipPreflight: true },
    });
    // Toast functionality will be replaced with a custom notification
  } catch (e) {
    console.error("Creating LUT failed:", e);
  }
};

// Initialize guards function
const initializeGuards = (umi: Umi, candyMachine: CandyMachine, candyGuard: CandyGuard) => async () => {
  if (!candyGuard.groups) return;
  
  candyGuard.groups.forEach(async (group) => {
    let builder = transactionBuilder();
    if (group.guards.allocation.__option === "Some") {
      builder = builder.add(
        route(umi, {
          guard: "allocation",
          candyMachine: candyMachine.publicKey,
          candyGuard: candyMachine.mintAuthority,
          group: some(group.label),
          routeArgs: {
            candyGuardAuthority: umi.identity,
            id: group.guards.allocation.value.id,
          },
        })
      );
    }
    // ... rest of the guard initialization logic
  });
};

// Buy a beer function
const buyABeer = (umi: Umi, amount: string) => async () => {
  const cleanAmount = amount.replace(" SOL", "");
  let builder = transactionBuilder()
    .add(addMemo(umi, { memo: "🍻" }))
    .add(
      transferSol(umi, {
        destination: publicKey("BeeryDvghgcKPTUw3N3bdFDFFWhTWdWHnsLuVebgsGSD"),
        amount: sol(Number(cleanAmount)),
      })
    );
  try {
    await builder.sendAndConfirm(umi, {
      confirm: { commitment: "processed" },
      send: { skipPreflight: true },
    });
    console.log("Beer purchase successful! 🍻");
  } catch (e) {
    console.error("Beer purchase failed:", e);
  }
};

export const InitializeModal = ({ umi, candyMachine, candyGuard }: Props) => {
  const toast = useToast();
  const [recentSlot, setRecentSlot] = useState<number>(0);
  const [amount, setAmount] = useState<string>("5");

  useEffect(() => {
    (async () => {
      setRecentSlot(await umi.rpc.getSlot());
    })();
  }, [umi]);

  if (!candyGuard) {
    console.error("no guard defined!");
    return <></>;
  }

  const roots = new Map<string, string>();
  allowLists.forEach((value, key) => {
    const merkleRoot = Buffer.from(getMerkleRoot(value)).toString('hex');
    roots.set(key, merkleRoot);
  });

  const handleCreateLut = async () => {
    try {
      await createLut(umi, candyMachine, candyGuard, recentSlot)();
      toast.showToast("LUT created successfully!", "success");
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      toast.showToast("Failed to create LUT", "error", errorMessage);
    }
  };

  const handleInitializeGuards = async () => {
    try {
      await initializeGuards(umi, candyMachine, candyGuard)();
      toast.showToast("Guards initialized successfully!", "success");
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      toast.showToast("Failed to initialize guards", "error", errorMessage);
    }
  };

  const handleBuyBeer = async () => {
    try {
      await buyABeer(umi, amount)();
      toast.showToast("Thanks for the beer! 🍻", "success");
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      toast.showToast("Beer purchase failed", "error", errorMessage);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleCreateLut}
          className="bg-primary hover:bg-accent text-background px-4 py-2 rounded"
        >
          Create LUT
        </button>
        <span className="text-white">Reduces transaction size errors</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={handleInitializeGuards}
          className="bg-primary hover:bg-accent text-background px-4 py-2 rounded"
        >
          Initialize Guards
        </button>
        <span className="text-white">Required for some guards</span>
      </div>

      <div className="flex items-center space-x-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-widget text-white px-3 py-2 rounded w-24"
          step="0.5"
          min="0"
        />
        <button
          onClick={handleBuyBeer}
          className="bg-primary hover:bg-accent text-background px-4 py-2 rounded"
        >
          Buy me a Beer 🍻
        </button>
      </div>

      {roots.size > 0 && (
        <div className="mt-4">
          <h3 className="text-white font-bold mb-2">
            Merkle trees for your allowlist.tsx:
          </h3>
          {Array.from(roots).map(([key, value]) => (
            <div key={key} className="bg-widget p-3 rounded mb-2">
              <p className="text-white font-semibold">{key}:</p>
              <p className="text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};