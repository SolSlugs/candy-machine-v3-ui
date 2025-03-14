// Purpose: Contains texts that will be used in the UI when rendering the buttons
// label has to be the exact same as in your candy machine config
export const mintText = [
  {
    label: "default",
    header: "Redeem Gen 4 Slugs",
    mintText: "You need to hold a Gen 4 mint token to redeem your Sol Slug. Each token can be used to mint one Slug.",
    buttonLabel: "Mint now!",
  },
  { label: "WL", mintText: "WL mint paying with SOL", buttonLabel: "Mint now!", header: "WL Mint" },
  { label: "OG", mintText: "Mint Paying with ABC", buttonLabel: "Mint now!", header: "OG Mint" },
  { label: "publi", mintText: "Mint Paying with DEF", buttonLabel: "Mint now!", header: "Public Mint" }
];

//website title
export const headerText = "Sol Slugs Gen 4";