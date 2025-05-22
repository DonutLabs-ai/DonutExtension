import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import getCoinGeckoService, { ChartTimePeriod } from '@/services/coinGeckoService';
import { isAddress } from '@/utils/address';
import { ParsedCommand } from '../../../utils/commandUtils';
import { getMCPService } from '@/services/mcpService';

interface PriceChartProps {
  parsedCommand: ParsedCommand;
}

const PriceChart = ({ parsedCommand }: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<ChartTimePeriod>('7d');

  // Get token symbol from the parsed command
  const getTokenSymbol = useCallback(async () => {
    setTokenSymbol(null);
    const token = parsedCommand.parameters?.token;
    if (!token) return;

    if (isAddress(token)) {
      try {
        const mcpService = getMCPService();
        const result = await mcpService.callTool('GET_TOKEN_INFO', {
          token,
        });
        const text = result.content[0].text;
        if (!text) return;
        const json = JSON.parse(text);
        if (json.status !== 'success') return;
        const symbol = json.supportedTokens.symbol;
        setTokenSymbol(symbol);
      } catch (err) {
        setTokenSymbol(null);
      }
    } else {
      return setTokenSymbol(token);
    }
  }, [parsedCommand.parameters?.token]);

  useEffect(() => {
    getTokenSymbol();
  }, [getTokenSymbol]);

  useEffect(() => {
    // Create chart instance
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 288,
        layout: {
          background: { color: '#1E1E1E' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: '#2E2E2E' },
          horzLines: { color: '#2E2E2E' },
        },
        timeScale: {
          borderColor: '#3C3C3C',
          timeVisible: true,
        },
        localization: {
          locale: 'en-US',
          priceFormatter: (price: number) => price.toLocaleString('en-US'),
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

      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a', // Green for price increase
        downColor: '#ef5350', // Red for price decrease
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

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

  // Load chart data when token or time period changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!tokenSymbol) return;

      try {
        setError(null);

        // Get CoinGecko service
        const coinGeckoService = getCoinGeckoService();

        // Get coin ID from symbol
        const coinId = await coinGeckoService.getCoinIdFromSymbol(tokenSymbol);

        if (!coinId) {
          setError(`Token ${tokenSymbol} not found`);
          return;
        }

        // Get OHLC chart data
        const ohlcData = await coinGeckoService.getCoinOHLC(coinId, 'usd', timePeriod);

        if (ohlcData.length === 0) {
          setError(`No chart data available for ${tokenSymbol}`);
          return;
        }

        // Update chart with OHLC data
        if (seriesRef.current) {
          seriesRef.current.setData(ohlcData);

          // Fit content to visible range
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data');
      }
    };

    loadChartData();
  }, [tokenSymbol, timePeriod]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {tokenSymbol ? `${tokenSymbol} Price Chart` : 'Price Chart'}
        </h3>

        <div className="flex gap-2">
          {(['1d', '7d', '30d', '90d', '365d'] as ChartTimePeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-2 py-1 text-xs rounded ${
                timePeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-72 bg-card rounded-md overflow-hidden relative"
      >
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-destructive text-sm">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
