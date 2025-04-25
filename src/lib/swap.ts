// put api key in this file not commited
import { oxApiKey } from "./secrets-swap-key";
import { Eip1193Provider, MaxInt256 } from "ethers";

import qs from "qs";
import Web3 from "web3";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

async function listAvailableTokens(): Promise<any> {
  console.log("initializing");
  let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  let tokenListJSON = await response.json();
  console.log("listing available tokens: ", tokenListJSON);
  const tokens = tokenListJSON.tokens;
  console.log("tokens: ", tokens);

  return tokens;
}

async function connect(): Promise<boolean> {
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("connecting");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  } else {
    console.log("Please install MetaMask");
    return false;
  }
}

async function getPrice(
  sellToken: any,
  buyToken: any,
  sellAmount: number,
  decimals: number
): Promise<any> {
  const params = {
    sellToken,
    buyToken,
    sellAmount,
  };

  const headers = { "0x-api-key": oxApiKey };

  // Fetch the swap price.
  const response = await fetch(
    `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`,
    { headers }
  );

  const swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);

  return swapPriceJSON.buyAmount / 10 ** decimals;
}

async function getQuote(
  sellToken: any,
  buyToken: any,
  sellAmount: number,
  takerAddress: any
) {
  console.log("Getting Quote");

  const params = {
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
  };

  const headers = { "0x-api-key": oxApiKey }; // This is a placeholder. Get your live API key from the 0x Dashboard (https://dashboard.0x.org/apps)

  // Fetch the swap quote.
  const response = await fetch(
    `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`,
    { headers }
  );

  const swapQuoteJSON = await response.json();
  console.log("Quote: ", swapQuoteJSON);

  return swapQuoteJSON;
}

async function trySwap(sellToken: any, buyToken: any, sellAmount: number) {
  const erc20abi = [
    {
      inputs: [
        { internalType: "string", name: "name", type: "string" },
        { internalType: "string", name: "symbol", type: "string" },
        { internalType: "uint256", name: "max_supply", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
      name: "burn",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "account", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "burnFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  console.log("trying swap");

  // Only work if MetaMask is connect
  // Connecting to Ethereum: Metamask
  const web3 = new Web3(Web3.givenProvider);

  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await window.ethereum?.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  console.log("takerAddress: ", takerAddress);

  const swapQuoteJSON = await getQuote(
    sellToken,
    buyToken,
    sellAmount,
    takerAddress
  );

  // Set Token Allowance
  // Set up approval amount
  const maxApproval = MaxInt256;
  console.log("approval amount: ", maxApproval);
  const ERC20TokenContract = new web3.eth.Contract(erc20abi, sellToken);
  console.log("setup ERC20TokenContract: ", ERC20TokenContract);

  // Grant the allowance target an allowance to spend our tokens.
  const tx = await ERC20TokenContract.methods
    .approve(swapQuoteJSON.allowanceTarget, maxApproval)
    .send({ from: takerAddress })
    .then((tx) => {
      console.log("tx: ", tx);
    });

  // Perform the swap
  const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
  console.log("receipt: ", receipt);
}

export { trySwap, connect, listAvailableTokens };
