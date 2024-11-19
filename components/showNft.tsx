import { JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@metaplex-foundation/umi";
import React from "react";

interface TraitProps {
  heading: string;
  description: string;
}

const Trait = ({ heading, description }: TraitProps) => {
  return (
    <div className="bg-widget rounded p-3 w-30 min-h-[50px]">
      <div className="flex flex-col items-center">
        <span className="text-sm text-white">{heading}</span>
        <span className="text-sm font-semibold text-primary -mt-1">
          {description}
        </span>
      </div>
    </div>
  );
};

interface TraitsProps {
  metadata: JsonMetadata;
}

const Traits = ({ metadata }: TraitsProps) => {
  if (metadata === undefined || metadata.attributes === undefined) {
    return <></>;
  }

  const traits = metadata.attributes.filter(
    (a) => a.trait_type !== undefined && a.value !== undefined
  );

  return (
    <>
      <div className="h-px bg-widget my-4" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        {traits.map((t) => (
          <Trait
            key={t.trait_type}
            heading={t.trait_type ?? ""}
            description={t.value ?? ""}
          />
        ))}
      </div>
    </>
  );
};

function Card({ metadata }: { metadata: JsonMetadata | undefined }) {
  if (!metadata) {
    return <></>;
  }
  
  const image = metadata.animation_url ?? metadata.image;
  
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="h-64 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${image})` }}
      />
      <h3 className="font-semibold text-white mt-4">{metadata.name}</h3>
      <p className="text-white">{metadata.description}</p>
      <Traits metadata={metadata} />
    </div>
  );
}

type Props = {
  nfts:
    | { mint: PublicKey; offChainMetadata: JsonMetadata | undefined }[]
    | undefined;
};

export const ShowNft = ({ nfts }: Props) => {
  if (nfts === undefined) {
    return <></>;
  }

  return (
    <div className="divide-y divide-widget">
      {nfts.map((nft) => (
        <div key={nft.mint} className="py-4">
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white">{nft.offChainMetadata?.name}</span>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24" className="text-primary"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <div className="mt-4">
              <Card metadata={nft.offChainMetadata} />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};
