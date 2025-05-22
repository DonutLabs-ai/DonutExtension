import React, { useEffect, useState } from 'react';
import { getMCPService } from '@/services/mcpService';
import { MCPTool, MCPToolResult } from '@/utils/mcpClient';
import { DONUT_MCP_SERVER_URL } from '@/constants/mcp';
import { Button } from '@/components/shadcn/button';
export default function MCPDemoPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [args, setArgs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<MCPToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Connect to MCP server
  useEffect(() => {
    const mcpService = getMCPService();

    async function connectToMCP() {
      try {
        setIsLoading(true);
        setError(null);
        setConnectionAttempted(true);
        await mcpService.connect(DONUT_MCP_SERVER_URL);
        setIsConnected(true);

        // Get tools list
        const availableTools = await mcpService.getTools();
        console.log('availableTools', availableTools);
        setTools(availableTools);

        // Set default selected tool (if any)
        if (availableTools.length > 0) {
          setSelectedTool(availableTools[0].name);

          // Create default values for tool parameters
          const defaultArgs: Record<string, any> = {};
          const tool = availableTools[0];

          if (tool.inputSchema?.properties) {
            Object.entries(tool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
              // Provide default values for different field types
              if (prop.type === 'string') {
                defaultArgs[key] = '';
              } else if (prop.type === 'number') {
                defaultArgs[key] = 0;
              } else if (prop.type === 'boolean') {
                defaultArgs[key] = false;
              } else if (prop.type === 'object') {
                defaultArgs[key] = {};
              } else if (prop.type === 'array') {
                defaultArgs[key] = [];
              }
            });
          }

          setArgs(defaultArgs);
        }
      } catch (err) {
        setError(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }

    connectToMCP();
  }, []);

  // Handle tool selection change
  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const toolName = e.target.value;
    setSelectedTool(toolName);

    // Update default parameter values
    const tool = tools.find(t => t.name === toolName);
    if (tool?.inputSchema?.properties) {
      const defaultArgs: Record<string, any> = {};

      Object.entries(tool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
        // Provide default values for different field types
        if (prop.type === 'string') {
          defaultArgs[key] = '';
        } else if (prop.type === 'number') {
          defaultArgs[key] = 0;
        } else if (prop.type === 'boolean') {
          defaultArgs[key] = false;
        } else if (prop.type === 'object') {
          defaultArgs[key] = {};
        } else if (prop.type === 'array') {
          defaultArgs[key] = [];
        }
      });

      setArgs(defaultArgs);
    } else {
      setArgs({});
    }
  };

  // Handle parameter changes
  const handleArgChange = (key: string, value: any) => {
    setArgs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Call tool
  const handleCallTool = async () => {
    if (!selectedTool) return;

    const mcpService = getMCPService();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const toolResult = await mcpService.callTool(selectedTool, args);
      setResult(toolResult);
    } catch (err) {
      setError(`Tool call failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry connection
  const handleRetryConnection = async () => {
    const mcpService = getMCPService();
    mcpService.disconnect(); // Ensure we're disconnected first

    // Reset states
    setTools([]);
    setSelectedTool('');
    setArgs({});
    setResult(null);
    setError(null);

    // Reconnect
    try {
      setIsLoading(true);
      await mcpService.connect(DONUT_MCP_SERVER_URL);
      setIsConnected(true);

      // Get tools list
      const availableTools = await mcpService.getTools();
      setTools(availableTools);

      if (availableTools.length > 0) {
        setSelectedTool(availableTools[0].name);
      }
    } catch (err) {
      setError(`Connection retry failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh tools list
  const handleRefreshTools = async () => {
    const mcpService = getMCPService();
    setIsLoading(true);
    setError(null);

    try {
      const availableTools = await mcpService.refreshTools();
      setTools(availableTools);

      // Reset selection if current tool is no longer available
      if (!availableTools.some(t => t.name === selectedTool) && availableTools.length > 0) {
        setSelectedTool(availableTools[0].name);
      }
    } catch (err) {
      setError(`Failed to refresh tools list: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render parameter input form
  const renderArgInputs = () => {
    const selectedToolObj = tools.find(t => t.name === selectedTool);
    if (!selectedToolObj?.inputSchema?.properties) {
      return <p>This tool has no parameters</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(selectedToolObj.inputSchema.properties).map(
          ([key, prop]: [string, any]) => {
            const required = selectedToolObj.inputSchema.required?.includes(key);
            return (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">
                  {key}
                  {required && <span className="text-destructive">*</span>}
                  {prop.description && (
                    <span className="ml-2 text-xs text-muted-foreground">{prop.description}</span>
                  )}
                </label>

                {prop.type === 'string' && (
                  <input
                    type="text"
                    value={args[key] || ''}
                    onChange={e => handleArgChange(key, e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                )}

                {prop.type === 'number' && (
                  <input
                    type="number"
                    value={args[key] || 0}
                    onChange={e => handleArgChange(key, parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1"
                  />
                )}

                {prop.type === 'boolean' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={args[key] || false}
                      onChange={e => handleArgChange(key, e.target.checked)}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </div>
                )}

                {(prop.type === 'object' || prop.type === 'array') && (
                  <textarea
                    value={JSON.stringify(args[key] || (prop.type === 'object' ? {} : []), null, 2)}
                    onChange={e => {
                      try {
                        handleArgChange(key, JSON.parse(e.target.value));
                      } catch {
                        // If JSON is invalid, don't update
                      }
                    }}
                    rows={5}
                    className="w-full border rounded px-2 py-1 font-mono text-sm"
                  />
                )}
              </div>
            );
          }
        )}
      </div>
    );
  };

  // Render tool call result
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="mt-6 p-4 bg-accent rounded">
        <h3 className="text-lg font-medium mb-2">Result</h3>
        {result.content.map((item, index) => {
          if (item.type === 'text') {
            return (
              <div key={index} className="whitespace-pre-wrap">
                {item.text}
              </div>
            );
          } else if (item.type === 'image') {
            return (
              <div key={index}>
                <img
                  src={`data:${item.mimeType || 'image/png'};base64,${item.data}`}
                  alt="Tool Result"
                  className="max-w-full"
                />
              </div>
            );
          } else if (item.type === 'resource' && item.resource) {
            return (
              <div key={index} className="p-2 border rounded">
                <div className="font-medium">{item.resource.name}</div>
                <div className="text-sm">{item.resource.description}</div>
              </div>
            );
          }
          return <div key={index}>Unsupported content type: {item.type}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
          </div>

          {!isConnected && connectionAttempted && (
            <button
              onClick={handleRetryConnection}
              className="px-2 py-1 bg-accent text-foreground hover:bg-foreground/80 rounded text-xs"
              disabled={isLoading}
            >
              Retry
            </button>
          )}
        </div>
        <div className="text-sm text-foreground truncate" title={DONUT_MCP_SERVER_URL}>
          Server: {DONUT_MCP_SERVER_URL}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-3 bg-foreground/10 border border-foreground rounded text-sm">
          Loading...
        </div>
      )}

      {isConnected && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Available Tools</h3>
              <button
                onClick={handleRefreshTools}
                className="px-2 py-1 bg-foreground hover:bg-accent/80 rounded text-sm"
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>

            {tools.length === 0 ? (
              <p className="text-foreground italic">No available tools</p>
            ) : (
              <select
                className="w-full border rounded p-2"
                value={selectedTool}
                onChange={handleToolChange}
                disabled={isLoading}
              >
                {tools.map(tool => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name} - {tool.description || 'No description'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedTool && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Tool Parameters</h3>
              {renderArgInputs()}
            </div>
          )}

          <Button onClick={handleCallTool} className="w-full" disabled={isLoading || !selectedTool}>
            Call Tool
          </Button>

          {renderResult()}
        </>
      )}
    </div>
  );
}
