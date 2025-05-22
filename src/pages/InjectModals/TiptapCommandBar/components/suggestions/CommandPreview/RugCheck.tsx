import React, { useState, useEffect, useCallback } from 'react';
import CircleCheck from '@/assets/images/circleCheck.svg?react';
import CircleXmark from '@/assets/images/circleXmark.svg?react';
import { ParsedCommand } from '../../../utils/commandUtils';
import { Skeleton } from '@/components/shadcn/skeleton';
import { getMCPService } from '@/services/mcpService';
import { enhanceParameters } from '../../../utils/tokenParamUtils';

interface RugCheckProps {
  parsedCommand?: ParsedCommand;
}

/**
 * RugCheck Skeleton Component
 * Displays loading skeleton for RugCheck information
 */
const RugCheckSkeleton = () => {
  return (
    <div className="max-w-[670px] mx-auto">
      {/* single grid layout for all sections */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-6 auto-rows-auto">
        {/* token info and price skeleton */}
        <div className="flex flex-col justify-center items-center gap-3 border border-border rounded-2xl p-4">
          {/* token icon skeleton */}
          <Skeleton className="w-12 h-12 rounded-full" />

          {/* token name skeleton */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-20 h-5" />
            <Skeleton className="w-10 h-5" />
          </div>

          {/* token price skeleton */}
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="w-16 h-7" />
            <Skeleton className="w-12 h-4" />
          </div>
        </div>

        {/* statistics skeleton */}
        <div className="flex flex-col gap-3 border border-border rounded-2xl p-4 justify-center">
          {/* address skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-32 h-5" />
          </div>

          {/* market cap skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="w-20 h-5" />
            <Skeleton className="w-28 h-5" />
          </div>

          {/* trading volume skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-28 h-5" />
          </div>

          {/* total supply skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-40 h-5" />
          </div>

          {/* token type skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="w-20 h-5" />
            <Skeleton className="w-5 h-5" />
          </div>
        </div>

        {/* security audit skeleton */}
        <div className="border border-border rounded-2xl p-4 md:p-5 mt-4 md:mt-0">
          <Skeleton className="w-14 h-5 mb-4" />
          <div className="flex flex-col gap-3">
            {/* audit items skeleton */}
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="flex gap-2 items-center">
                <Skeleton className="w-5 h-5 flex-shrink-0 rounded-full" />
                <Skeleton className="w-32 h-5" />
              </div>
            ))}
          </div>
        </div>

        {/* risk assessment skeleton */}
        <div className="border border-border rounded-2xl p-4 mt-4 md:mt-0">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="w-20 h-5" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-10 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-8 rounded" />
            <Skeleton className="w-40 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * RugCheck component
 * Displays token security audit and risk assessment information
 */
const RugCheck: React.FC<RugCheckProps> = ({ parsedCommand }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const getTokenAddress = useCallback(async () => {
    if (!parsedCommand) return null;
    const token = parsedCommand?.parameters?.token;
    if (isAddress(token)) return token;
    const parsedParams = enhanceParameters(
      parsedCommand.command,
      parsedCommand.parameters || {},
      parsedCommand.parsedParams
    );
    return parsedParams?.token?.mint || null;
  }, [parsedCommand]);

  const getRugCheckData = useCallback(async () => {
    const address = await getTokenAddress();
    if (!address) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const mcpService = getMCPService();
      const result = await mcpService.callTool('DONUT_RUGCHECK', {
        tokenId: address,
      });
      const text = result.content[0].text;
      if (!text) return null;
      const json = JSON.parse(text);
      if (json.status !== 'success') return null;
      console.log('rugCheck', json);
      return json;
    } catch (error) {
      console.error('Error getting rug check data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getTokenAddress]);

  useEffect(() => {
    getRugCheckData().then(setData);
  }, [getRugCheckData]);

  if (loading) {
    return <RugCheckSkeleton />;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">No data found</div>;
  }

  const tokenData = {
    name: 'Solana',
    symbol: 'SOL',
    price: '118.62',
    priceChange: '+12.3%',
    address: 'So111111...111112',
    marketCap: '$82,345,678.90',
    tradingVolume: '$72,345,678.90',
    totalSupply: '466,567,890.12 tokens',
    tokenType: '-',
    riskScore: '92/100',
    riskLevel: 'Low Risk',
  };

  return (
    <div className="max-w-[670px] mx-auto">
      {/* single grid layout for all sections */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-6 auto-rows-auto">
        {/* token info and price */}
        <div className="flex flex-col justify-center items-center gap-2 border border-border rounded-2xl p-4">
          {/* token icon */}
          <div className="rounded bg-accent w-12 h-12"></div>

          {/* token name */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-base text-foreground">{tokenData.name}</span>
            <span className="font-semibold text-base text-foreground">({tokenData.symbol})</span>
          </div>

          {/* token price */}
          <div className="flex flex-col items-center">
            <span className="font-bold text-xl md:text-2xl text-foreground">
              ${tokenData.price}
            </span>
            <span className="text-[#27C941] text-sm md:text-base">{tokenData.priceChange}</span>
          </div>
        </div>

        {/* statistics */}
        <div className="flex flex-col gap-2.5 border border-border rounded-2xl p-4 justify-center">
          {/* address */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Address</div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm md:text-base">
                {tokenData.address}
              </span>
              <div className="text-muted-foreground">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 8H16V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 8L5 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* market cap */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Market Cap:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {tokenData.marketCap}
            </div>
          </div>

          {/* trading volume */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">24 Hrs Trading Vol:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {tokenData.tradingVolume}
            </div>
          </div>

          {/* total supply */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Total Supply:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {tokenData.totalSupply}
            </div>
          </div>

          {/* token type */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Token Type:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {tokenData.tokenType}
            </div>
          </div>
        </div>

        {/* security audit - new row in grid */}
        <div className="border border-border rounded-2xl p-4 md:p-5 mt-4 md:mt-0">
          <div className="text-sm md:text-base text-foreground mb-3.5">Audit:</div>
          <div className="flex flex-col gap-3">
            {/* audit items */}
            <div className="flex gap-2 items-center">
              <CircleCheck className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base text-foreground">Mint Disabled</span>
            </div>
            <div className="flex gap-2 items-center">
              <CircleCheck className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base text-foreground">Freeze Disabled</span>
            </div>
            <div className="flex gap-2 items-center">
              <CircleCheck className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base text-foreground">LP Burned</span>
            </div>
            <div className="flex gap-2 items-center w-full">
              <CircleXmark className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base text-foreground">
                Top 10 Holders Significant
              </span>
            </div>
          </div>
        </div>

        {/* risk assessment - aligned with audit */}
        <div className="border border-border rounded-2xl p-4 mt-4 md:mt-0">
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Risk Score:</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tokenData.riskLevel}</span>
              <span className="text-sm md:text-base text-foreground">{tokenData.riskScore}</span>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mt-3">
            <div className="rounded px-3 py-1 bg-muted border border-[#05D137] whitespace-nowrap">
              <span className="text-[#05D137]">Low</span>
            </div>
            <div className="text-sm md:text-base text-foreground">
              Minor liquidity concentration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RugCheck;
