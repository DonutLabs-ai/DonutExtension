import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import getCoinGeckoService, { ChartTimePeriod } from '@/services/coinGeckoService';
import { getMCPService } from '@/services/mcpService';
import { isAddress } from '@/utils/address';
import { cn } from '@/utils/shadcn';
import { ParsedCommand } from '../../../utils/commandUtils';
import CandlestickIcon from '../../../images/candlestick.svg?react';
import LineIcon from '../../../images/line.svg?react';
import { enhanceParameters } from '../../../utils/tokenParamUtils';

type ChartType = 'candlestick' | 'line';

interface PriceChartProps {
  parsedCommand: ParsedCommand;
}

const PriceChart = ({ parsedCommand }: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenIcon, setTokenIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timePeriod, setTimePeriod] = useState<ChartTimePeriod>('7d');
  const [chartType, setChartType] = useState<ChartType>('candlestick');

  // Get token symbol from the parsed command
  const getTokenSymbolAndIcon = useCallback(async () => {
    setTokenSymbol(null);
    setTokenIcon(null);
    setLoading(true);
    const token = parsedCommand.parameters?.token;
    if (!token) {
      setLoading(false);
      return;
    }

    if (isAddress(token)) {
      try {
        const mcpService = getMCPService();
        const result = await mcpService.callTool('GET_TOKEN_INFO', {
          token,
        });
        const text = result.content[0].text;
        if (!text) {
          setLoading(false);
          return;
        }
        const json = JSON.parse(text);
        if (json.status !== 'success') {
          setLoading(false);
          return;
        }
        const symbol = json.supportedTokens?.symbol || null;
        const image = json.supportedTokens?.image;
        const icon = image?.small || image?.thumb || null;
        setTokenSymbol(symbol);
        setTokenIcon(icon);
      } catch (err) {
        setTokenSymbol(null);
        setTokenIcon(null);
        setLoading(false);
      }
    } else {
      const parsedParams = enhanceParameters(
        parsedCommand.command,
        parsedCommand.parameters || {},
        parsedCommand.parsedParams
      );
      setTokenSymbol(parsedParams?.token?.symbol || null);
      setTokenIcon(parsedParams?.token?.logoURI || null);
    }
  }, [parsedCommand.command, parsedCommand.parameters, parsedCommand.parsedParams]);

  // Create or recreate chart series based on chart type
  const createSeries = useCallback(() => {
    if (!chartRef.current) return;

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    // Create new series based on chart type
    if (chartType === 'candlestick') {
      const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#05d137',
        downColor: '#f03838',
        borderVisible: false,
        wickUpColor: '#05d137',
        wickDownColor: '#f03838',
      });
      seriesRef.current = candlestickSeries;
    } else {
      const lineSeries = chartRef.current.addSeries(LineSeries, {
        color: '#05d137',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      seriesRef.current = lineSeries;
    }
  }, [chartType]);

  useEffect(() => {
    getTokenSymbolAndIcon();
  }, [getTokenSymbolAndIcon]);

  useEffect(() => {
    // Create chart instance
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 190,
        layout: {
          background: { color: '#0e0e0e' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: '#1c1c1c' },
          horzLines: { color: '#1c1c1c' },
        },
        timeScale: {
          borderColor: '#1c1c1c',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: '#1c1c1c',
          textColor: '#ffffff',
        },
        localization: {
          locale: 'en-US',
          priceFormatter: (price: number) =>
            '$' +
            price.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            }),
          timeFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          },
        },
      });

      chartRef.current = chart;

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
        }
      };
    }
  }, []);

  // Create series when chart type changes
  useEffect(() => {
    if (chartRef.current) {
      createSeries();
    }
  }, [createSeries]);

  // Load chart data when token, time period, or chart type changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!tokenSymbol || !seriesRef.current) return;

      setLoading(true);
      setError(null);
      try {
        // Get CoinGecko service
        const coinGeckoService = getCoinGeckoService();

        // Get coin ID from symbol
        const coinId = await coinGeckoService.getCoinIdFromSymbol(tokenSymbol);

        if (!coinId) {
          setError(`Token ${tokenSymbol} not found`);
          return;
        }

        if (chartType === 'candlestick') {
          // Get OHLC chart data for candlestick
          const ohlcData = await coinGeckoService.getCoinOHLC(coinId, 'usd', timePeriod);

          if (ohlcData.length === 0) {
            setError(`No chart data available for ${tokenSymbol}`);
            return;
          }

          seriesRef.current.setData(ohlcData);
        } else {
          // Get price data for line chart
          const priceData = await coinGeckoService.getMarketChart(coinId, 'usd', timePeriod);

          if (priceData.length === 0) {
            setError(`No chart data available for ${tokenSymbol}`);
            return;
          }

          // Data is already in the correct format for line series
          seriesRef.current.setData(priceData);
        }

        // Fit content to visible range
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [tokenSymbol, timePeriod, chartType]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tokenIcon && (
            <Avatar className="w-6 h-6">
              <AvatarImage src={tokenIcon} />
              <AvatarFallback>{tokenSymbol?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div className="text-base font-semibold text-foreground">
            {tokenSymbol ? `${tokenSymbol.toUpperCase()}` : '-'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Period Buttons */}
          <div className="flex gap-1">
            {(['1d', '7d', '30d', '90d'] as ChartTimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={cn(
                  'px-4 text-sm rounded-2xl transition-all font-semibold bg-card hover:bg-card/80 cursor-pointer h-8 flex items-center',
                  timePeriod === period ? 'text-primary' : 'text-card-foreground'
                )}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-card rounded-2xl px-[6px] h-8 gap-1">
            <CandlestickIcon
              className={cn(
                'w-7 h-7 cursor-pointer',
                chartType === 'candlestick' ? 'text-primary' : 'text-card-foreground'
              )}
              onClick={() => setChartType('candlestick')}
            />
            <LineIcon
              className={cn(
                'w-7 h-7 cursor-pointer',
                chartType === 'line' ? 'text-primary' : 'text-card-foreground'
              )}
              onClick={() => setChartType('line')}
            />
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[190px] bg-background rounded-md overflow-hidden relative border border-border"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-foreground text-sm bg-card px-4 py-2 rounded border border-border">
              Loading chart data...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-destructive text-sm bg-card px-4 py-2 rounded border border-border">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
