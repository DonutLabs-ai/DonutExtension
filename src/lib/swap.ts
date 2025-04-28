// put api key in this file not commited
import { oxApiKey } from "./secrets-swap-key";
import {
  Eip1193Provider,
  MaxInt256,
  BrowserProvider,
  Contract,
  TypedDataField,
  toBeHex,
  concat,
} from "ethers";
import tokensJSON from "../public/supported-tokens.json";

import qs from "qs";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface Token {
  address: string;
  decimals: number;
}

export function supportedTokens(): Record<string, Token> {
  return parseTokens(tokensJSON);
}

function parseTokens(tokens: any): Record<string, Token> {
  let tokensRecord: Record<string, Token> = {};

  for (const token of tokens.tokens) {
    const tokenInfo: Token = {
      address: token.address,
      decimals: token.decimals,
    };
    tokensRecord[token.symbol] = tokenInfo;
  }

  return tokensRecord;
}

async function listAvailableTokens(): Promise<any> {
  let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  let tokenListJSON = await response.json();
  const tokens = tokenListJSON.tokens;

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

async function getQuote(
  sellToken: Token,
  buyToken: Token,
  sellAmount: number,
  takerAddress: string,
  chainId: number
) {
  console.log("Getting Quote");

  const params = {
    chainId: chainId,
    sellToken: sellToken.address,
    buyToken: buyToken.address,
    sellAmount,
    taker: takerAddress,
  };

  try {
    const headers = new Headers();
    headers.set("0x-api-key", oxApiKey);
    headers.set("0x-version", "v2");
    headers.set("User-Agent", "curl/7.81.0");

    // Fetch the swap quote.
    const response = await fetch(
      `api/swap/permit2/quote?${qs.stringify(params)}`,
      { headers }
    );
    console.log(response);

    const swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);
    return swapQuoteJSON;
  } catch {
    return { message: "You cannot consume this service" };
  }
}

async function trySwap(
  sellToken: Token,
  buyToken: Token,
  sellAmount: number
): Promise<string> {
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
  if (!window.ethereum) {
    return "no wallet connected";
  }
  // hardcode chainId to 1 for now
  const chainId = 1;
  const provider = new BrowserProvider(window.ethereum, chainId);
  const signer = await provider.getSigner();

  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await window.ethereum?.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  console.log("takerAddress: ", takerAddress);

  console.log(`sell token: ${sellToken}`);
  console.log(`buy token: ${buyToken}`);
  console.log(`buy number ${sellAmount}`);

  const swapQuoteJSON = await getQuote(
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    chainId
  );

  if (swapQuoteJSON.message === "You cannot consume this service") {
    return "get quote api call failed";
  } else if (swapQuoteJSON.message === "no Route matched with those values") {
    return "no swap path mathcing those tokens";
  }

  // Set Token Allowance
  // Set up approval amount
  const maxApproval = MaxInt256;
  console.log("approval amount: ", maxApproval);
  const ERC20TokenContract = new Contract(sellToken.address, erc20abi, signer);
  console.log("setup ERC20TokenContract: ", ERC20TokenContract);

  try {
    // Below logic not needed fo now as api includes this call in tx below

    // Grant the allowance target an allowance to spend our tokens.
    try {
      const permit2Address = swapQuoteJSON.issues.allowance.spender;
      const approveTx = await ERC20TokenContract.approve(
        permit2Address,
        maxApproval
      );
      console.log("tx approved: ", approveTx);
    } catch (e) {
      console.log(`approval tx failed: ${e}`);
    }

    try {
      const toAddress = swapQuoteJSON.transaction.to;
      const gas = !!swapQuoteJSON?.transaction.gas
        ? BigInt(swapQuoteJSON?.transaction.gas)
        : undefined;
      const gasPrice = swapQuoteJSON.transaction.gasPrice;
      const value = swapQuoteJSON.transaction.value;
      const data = swapQuoteJSON.transaction.data;

      // Perform the swap
      const receipt = await signer.sendTransaction({
        data: data,
        gasLimit: gas,
        gasPrice,
        to: toAddress,
        value,
        chainId,
      });

      console.log(receipt.hash);
      return `swap tx sent with tx hash: ${receipt.hash}`;
    } catch (e) {
      console.log(`swap tx failed: ${e}`);
      return "swap failed, likely lack of funds";
    }
  } catch (e) {
    console.log(e);
    return "transaction failed or was canceled";
  }
}

export { trySwap, connect, listAvailableTokens };
