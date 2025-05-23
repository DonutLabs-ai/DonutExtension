import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import CircleCheck from '@/assets/images/circleCheck.svg?react';
import CircleXmark from '@/assets/images/circleXmark.svg?react';
import { Skeleton } from '@/components/shadcn/skeleton';
import { getMCPService } from '@/services/mcpService';
import { ParsedCommand } from '../../../utils/commandUtils';
import { enhanceParameters } from '../../../utils/tokenParamUtils';
import Copy from '@/assets/images/copy.svg?react';
import { ellipseAddress } from '@/utils/address';
import { isAddress } from '@/utils/address';
import { numberIndent } from '@/utils/amount';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface IndicatorItem {
  title: string;
  value: boolean;
  level: string;
}

interface RugCheckResponse {
  tokenData: {
    auditRisk: {
      mintDisabled: boolean;
      freezeDisabled: boolean;
      lpBurned: boolean;
      top10Holders: boolean;
    };
    decimals: number;
    marketCap: number;
    score: number;
    address: string;
    tokenImg: string;
    tokenSymbol: string;
    tokenName: string;
    tokenOverview: {
      deployer: string;
      mint: string;
      address: string;
      type: string;
    };
    indicatorData: {
      high: {
        count: number;
        details: string;
      };
      moderate: {
        count: number;
        // Object string
        details: string;
      };
      low: {
        count: number;
        // Object string
        details: string;
      };
      specific: {
        count: number;
        // Object string
        details: string;
      };
    };
  };
  tokenInfo: {
    price: number;
    supplyAmount: number;
    mktCap: number;
  };
}

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
          <Skeleton className="w-16 h-7" />
        </div>

        {/* statistics skeleton */}
        <div className="flex flex-col gap-3 border border-border rounded-2xl p-4 justify-center">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-32 h-5" />
            </div>
          ))}
        </div>

        {/* security audit skeleton */}
        <div className="border border-border rounded-2xl p-4 md:p-5 mt-4 md:mt-0">
          <Skeleton className="w-14 h-5 mb-4" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-2 items-center">
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
            <Skeleton className="w-16 h-4" />
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
  const [data, setData] = useState<RugCheckResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
      const result = await mcpService.callTool('SOLSNIFFER_RUGCHECK', {
        tokenId: address,
      });
      const text = result.content[0].text;
      if (!text) return null;
      const json = JSON.parse(text);
      if (json.status !== 'success') return null;

      return json.response;
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

  const transformedIndicatorData = useMemo(() => {
    const indicatorData = data?.tokenData?.indicatorData;
    if (!indicatorData || typeof indicatorData !== 'object') {
      return [];
    }

    const items: IndicatorItem[] = [];

    Object.entries(indicatorData).forEach(([level, levelData]) => {
      if (!levelData || typeof levelData !== 'object') return;

      const details = levelData.details;
      if (!details || typeof details !== 'string') return;

      try {
        const parsedDetails = JSON.parse(details);
        if (typeof parsedDetails !== 'object' || !parsedDetails) return;

        Object.entries(parsedDetails).forEach(([title, value]) => {
          if (typeof value === 'boolean') {
            items.push({ title, value, level });
          }
        });
      } catch (error) {
        console.warn(`Failed to parse details for level ${level}:`, error);
      }
    });

    return items.sort((a, b) => {
      if (a.value !== b.value) {
        return a.value ? 1 : -1;
      }
      return 0;
    });
  }, [data?.tokenData?.indicatorData]);

  if (loading) {
    return <RugCheckSkeleton />;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">No data found</div>;
  }

  return (
    <div className="max-w-[670px] mx-auto">
      {/* single grid layout for all sections */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-6 auto-rows-auto">
        {/* token info and price */}
        <div className="flex flex-col justify-center items-center gap-2 border border-border rounded-2xl p-4">
          {/* token icon */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={data.tokenData.tokenImg} />
            <AvatarFallback>{data.tokenData.tokenSymbol.charAt(0)}</AvatarFallback>
          </Avatar>

          {/* token name */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-base text-foreground">
              {data.tokenData.tokenName}
            </span>
            <span className="font-semibold text-base text-foreground">
              ({data.tokenData.tokenSymbol})
            </span>
          </div>

          {/* token price */}
          <div className="flex flex-col items-center">
            <span className="font-bold text-xl md:text-2xl text-foreground">
              ${numberIndent(data.tokenInfo.price)}
            </span>
          </div>
        </div>

        {/* statistics */}
        <div className="flex flex-col gap-2.5 border border-border rounded-2xl p-4 justify-center">
          {/* address */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Address</div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm md:text-base">
                {ellipseAddress(data.tokenData.address)}
              </span>
              {copied && <span className="text-xs text-green-600 font-medium">Copied!</span>}
              <CopyToClipboard
                text={data.tokenData.address}
                onCopy={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Copy
                  className={cn(
                    'w-3 h-3 cursor-pointer transition-colors',
                    copied ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'
                  )}
                />
              </CopyToClipboard>
            </div>
          </div>

          {/* market cap */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Market Cap:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {numberIndent(data.tokenInfo.mktCap)}
            </div>
          </div>

          {/* total supply */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Total Supply:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {numberIndent(data.tokenInfo.supplyAmount)}
            </div>
          </div>

          {/* token type */}
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Token Type:</div>
            <div className="text-sm md:text-base text-foreground text-right">
              {data.tokenData.tokenOverview.type}
            </div>
          </div>
        </div>

        {/* security audit - new row in grid */}
        <div className="border border-border rounded-2xl p-4 md:p-5 h-max">
          <div className="text-sm md:text-base text-foreground mb-3.5">Audit:</div>
          <div className="flex flex-col gap-3">
            {/* audit items */}
            {Object.entries(data.tokenData.auditRisk || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                {value ? (
                  <CircleCheck className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CircleXmark className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm md:text-base text-foreground">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* risk assessment - aligned with audit */}
        <div className="border border-border rounded-2xl p-4 h-max">
          <div className="flex justify-between items-center">
            <div className="text-sm md:text-base text-foreground">Risk Score:</div>
            <div className="text-sm md:text-base text-foreground">{data.tokenData.score}/100</div>
          </div>
          {/* indicator details */}
          {transformedIndicatorData.map((item, index) => (
            <div key={index} className="flex gap-4 mt-3">
              {!item.value ? (
                <div
                  className={cn(
                    'rounded px-3 h-7 flex items-center bg-muted border whitespace-nowrap',
                    item.level === 'high' && 'border-red-700 text-red-700',
                    item.level === 'moderate' && 'border-yellow-700 text-yellow-700',
                    item.level === 'low' && 'border-green-700 text-green-700',
                    item.level === 'specific' && 'border-gray-700 text-gray-700'
                  )}
                >
                  {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                </div>
              ) : (
                <CircleCheck className="w-5 h-5 flex-shrink-0" />
              )}
              <div className={cn('text-sm md:text-base text-foreground', !item.value && 'mt-1')}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RugCheck;
