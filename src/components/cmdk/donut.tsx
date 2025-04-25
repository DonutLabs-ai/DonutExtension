import React from "react";
import { Command } from "cmdk";

export function DonutCMDK() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = React.useState("");

  const tradeDonut = React.useCallback(() => {
    console.log("trade");
    return false;
  }, []);

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = "scale(0.96)";
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = "";
        }
      }, 100);

      setInputValue("");
    }
  }

  return (
    <div className="donut">
      <Command
        ref={ref}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            const success = tradeDonut();
            bounce();
            if (success) {
              console.log("yay");
            } else {
              console.log("nay");
            }
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
      </Command>
    </div>
  );
}
