import React from "react";
import { Command } from "cmdk";
import { trySwap, supportedTokens, Token } from "../../lib/swap";

export const tokenRecord = supportedTokens();

export async function doAction(
  input: string[],
  tokenList: Record<string, Token>
) {
  console.log(input);
  switch (input.at(0)) {
    case "SWAP": {
      const amount = input.at(1) ?? "no number";
      const sellTokenTicker = input.at(2);
      const buyTokenTicker = input.at(3);

      const numberAmount = parseInt(amount, 10);

      if (!numberAmount) {
        return "invalid amount to buy";
      }

      if (sellTokenTicker) {
        console.log(sellTokenTicker);
        const sellToken = tokenList[sellTokenTicker];
        console.log(sellToken);
        console.log(tokenList);

        if (buyTokenTicker) {
          const buyToken = tokenList[buyTokenTicker];
          if (sellToken && buyToken) {
            const scaledAmount = numberAmount * 10 ** sellToken.decimals;
            console.log(scaledAmount);

            const stringReciept = await trySwap(
              sellToken,
              buyToken,
              scaledAmount
            );
            return stringReciept.toString();
          } else {
            return "token unsupported";
          }
        } else {
          return "enter buy token";
        }
      } else {
        return "enter sell token";
      }
    }
    default:
      return "action must be well defined (eg. swap)";
  }
}

export function DonutCMDK(tokenList: { tokenList: Record<string, Token> }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [actionValue, actionResult] = React.useState("");

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = "scale(0.96)";
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = "";
        }
      }, 100);
    }
  }

  return (
    <div className="donut">
      <Command
        ref={ref}
        onKeyDown={async (e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            bounce();
            const res = await doAction(
              inputValue.toUpperCase().split(" "),
              tokenList.tokenList
            );
            actionResult(res);
          }

          if (inputValue.length) {
            return;
          }
        }}
      >
        <Command.Input
          autoFocus
          placeholder="Trade with 🍩"
          onValueChange={(value) => {
            setInputValue(value);
          }}
        />
        <Command.List>
          <Command.Empty></Command.Empty>
        </Command.List>
      </Command>
      <div className="under command">{actionValue}</div>
    </div>
  );
}
