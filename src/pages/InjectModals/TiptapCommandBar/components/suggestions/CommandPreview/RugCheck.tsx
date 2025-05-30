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
    <div className="-mt-6 grid grid-cols-1 md:grid-cols-[2fr_3fr]">
      <div className="flex flex-col items-center">
        {/* token info and price skeleton */}
        <div className="flex flex-col justify-center items-center gap-2 pt-8 pb-4 md:pr-7">
          <div className="flex items-center gap-2">
            {/* token icon skeleton */}
            <Skeleton className="size-6 rounded-full" />

            {/* token name skeleton */}
            <Skeleton className="w-20 h-4" />
          </div>

          {/* token symbol skeleton */}
          <Skeleton className="w-10 h-3.5" />

          {/* token price skeleton */}
          <Skeleton className="w-20 h-6" />
        </div>

        {/* statistics skeleton */}
        <div className="w-full flex flex-col gap-2.5 justify-center py-4 md:pr-7">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center gap-2">
              <Skeleton className="w-16 h-3.5" />
              <Skeleton className="w-24 h-3.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:border-l border-border">
        {/* security audit skeleton */}
        <div className="py-4 md:pl-7 h-max">
          <Skeleton className="w-12 h-3.5 mb-3.5" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Skeleton className="w-5 h-5 flex-shrink-0 rounded-full" />
                <Skeleton className="w-20 h-3.5" />
              </div>
            ))}
          </div>
        </div>

        {/* risk assessment skeleton */}
        <div className="py-4 md:pl-7 h-max md:border-t border-border">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="w-16 h-3.5" />
            <Skeleton className="w-12 h-3.5" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4 mt-3">
              <Skeleton className="w-16 h-6 rounded" />
              <Skeleton className="w-32 h-3.5 mt-0.5" />
            </div>
          ))}
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

  const tokenAddress = useMemo(() => {
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
    if (!tokenAddress) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const mcpService = getMCPService();
      const result = await mcpService.callTool('SOLSNIFFER_RUGCHECK', {
        tokenId: tokenAddress,
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
  }, [tokenAddress]);

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
            let formatLevel = level;
            if (level === 'high') formatLevel = 'High';
            if (level === 'moderate') formatLevel = 'Med';
            if (level === 'low') formatLevel = 'Low';
            if (level === 'specific') formatLevel = 'Specific';
            if (value) formatLevel = 'Safe';

            items.push({ title, value, level: formatLevel });
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
    <div className="-mt-6 grid grid-cols-1 md:grid-cols-[2fr_3fr]">
      <div className="flex flex-col items-center">
        {/* token info and price */}
        <div className="flex flex-col justify-center items-center gap-2 pt-8 pb-4 md:pr-7">
          <div className="flex items-center gap-2">
            {/* token icon */}
            <Avatar className="size-6">
              <AvatarImage src={data.tokenData.tokenImg} />
              <AvatarFallback>{data.tokenData.tokenSymbol.charAt(0)}</AvatarFallback>
            </Avatar>

            {/* token name */}
            <div className="font-semibold text-base text-foreground text-center">
              {data.tokenData.tokenName}
            </div>
          </div>

          {/* token symbol */}
          <div className="font-normal text-sm text-foreground text-center">
            ${data.tokenData.tokenSymbol}
          </div>

          {/* token price */}
          <div className="font-semibold text-xl text-foreground text-center">
            ${numberIndent(data.tokenInfo.price)}
          </div>
        </div>

        {/* statistics */}
        <div className="w-full flex flex-col gap-2.5 justify-center py-4 md:pr-7">
          {/* address */}
          <div className="flex justify-between items-center gap-2">
            <div className="text-sm text-foreground">Address</div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">
                {ellipseAddress(data.tokenData.address)}
              </span>
              {copied && <span className="text-xs text-chart-2 font-medium">Copied!</span>}
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
                    copied ? 'text-chart-2' : 'text-muted-foreground hover:text-foreground'
                  )}
                />
              </CopyToClipboard>
            </div>
          </div>

          {/* market cap */}
          <div className="flex justify-between items-center gap-2">
            <div className="text-sm text-foreground">Market Cap</div>
            <div className="text-sm text-foreground text-right">
              {numberIndent(data.tokenInfo.mktCap)}
            </div>
          </div>

          {/* total supply */}
          <div className="flex justify-between items-center gap-2">
            <div className="text-sm text-foreground">Total Supply</div>
            <div className="text-sm text-foreground text-right">
              {numberIndent(data.tokenInfo.supplyAmount)}
            </div>
          </div>

          {/* token type */}
          <div className="flex justify-between items-center gap-2">
            <div className="text-sm text-foreground">Token Type</div>
            <div className="text-sm text-foreground text-right">
              {data.tokenData.tokenOverview.type}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:border-l border-border">
        {/* security audit - new row in grid */}
        <div className="py-4 md:pl-7 h-max">
          <div className="text-sm text-foreground mb-3.5">Audit:</div>
          <div className="flex flex-col gap-3">
            {/* audit items */}
            {Object.entries(data.tokenData.auditRisk || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                {value ? (
                  <CircleCheck className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CircleXmark className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm text-foreground">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* risk assessment - aligned with audit */}
        <div className="py-4 md:pl-7 h-max md:border-t border-border">
          <div className="flex justify-between items-center">
            <div className="text-sm text-foreground">Risk Score:</div>
            <div className="text-sm text-foreground">{data.tokenData.score}/100</div>
          </div>
          {/* indicator details */}
          {transformedIndicatorData.map((item, index) => (
            <div key={index} className="flex items-baseline gap-4 mt-3">
              <div
                className={cn(
                  'rounded w-14 h-6 flex items-center justify-center whitespace-nowrap text-sm font-semibold',
                  item.level === 'High' && 'bg-[#D10505]/30 text-[#FF9595]',
                  item.level === 'Med' && 'bg-[#D16105]/30 text-[#FFD195]',
                  item.level === 'Low' && 'bg-[#05D137]/30 text-[#82F1AB]',
                  item.level === 'Specific' && 'bg-[#8126D0]/30 text-[#C4A1FF]',
                  item.level === 'Safe' && 'bg-[#055ED1]/30 text-[#82D9F1]'
                )}
              >
                {item.level}
              </div>
              <div className="text-sm text-foreground">{item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RugCheck;
