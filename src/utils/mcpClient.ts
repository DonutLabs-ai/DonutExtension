import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

/**
 * MCP JSON-RPC message types
 */
export interface MCPJSONRPCRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPJSONRPCResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPJSONRPCNotification {
  jsonrpc: string;
  method: string;
  params?: any;
}

export type MCPJSONRPCMessage = MCPJSONRPCRequest | MCPJSONRPCResponse | MCPJSONRPCNotification;

/**
 * MCP tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * MCP tool result content item
 */
export interface MCPContentItem<T = any> {
  type: string;
  text?: string;
  data?: T;
  mimeType?: string;
  resource?: {
    name: string;
    description: string;
  };
}

/**
 * MCP tool result
 */
export interface MCPToolResult<T = any> {
  content: MCPContentItem<T>[];
}

/**
 * Resource result type
 */
export interface MCPResourceResult {
  contents: {
    uri: string;
    text?: string;
    data?: any;
    mimeType?: string;
  }[];
}

/**
 * Prompt result type
 */
export interface MCPPromptResult {
  messages: {
    role: string;
    content: {
      type: string;
      text?: string;
    };
  }[];
}

/**
 * MCP Client Class
 * Used to communicate with MCP servers via the official SDK
 */
export class MCPClient {
  private serverUrl: string;
  private tools: MCPTool[] = [];
  private initialized = false;
  private connected = false;

  // SDK client and transport
  private sdkClient: Client | null = null;
  private transport: SSEClientTransport | null = null;

  /**
   * Create MCP client instance
   * @param serverUrl MCP server endpoint URL
   */
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to MCP server and initialize
   */
  async connect(): Promise<void> {
    try {
      // Create SDK client
      this.sdkClient = new Client({
        name: 'donut-extension-mcp-client',
        version: '1.0.0',
      });

      const baseUrl = new URL(this.serverUrl);
      this.transport = new SSEClientTransport(baseUrl);

      // Connect to the MCP server
      await this.sdkClient.connect(this.transport);

      // Set state
      this.connected = true;
      this.initialized = true;

      // Refresh available tools
      await this.refreshTools();
    } catch (error) {
      this.connected = false;
      this.initialized = false;
      console.error('MCP: Connection failed', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Close MCP connection
   */
  disconnect(): void {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }

    this.sdkClient = null;
    this.initialized = false;
    this.connected = false;
  }

  /**
   * Get available MCP tools
   */
  async getTools(): Promise<MCPTool[]> {
    return [...this.tools];
  }

  /**
   * Refresh tools list
   */
  async refreshTools(): Promise<MCPTool[]> {
    try {
      if (!this.sdkClient) {
        throw new Error('MCP: Client not initialized');
      }

      const toolsList = await this.sdkClient.listTools();

      // Convert SDK Tool type to our MCPTool type
      this.tools = toolsList.tools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      }));

      return this.tools;
    } catch (error) {
      console.error('MCP: Failed to get tools list', error);
      return [];
    }
  }

  /**
   * Call MCP tool
   * @param toolName Tool name
   * @param args Tool parameters
   */
  async callTool<T = any>(toolName: string, args: Record<string, any>): Promise<MCPToolResult<T>> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      // Call the tool using SDK client
      const result = await this.sdkClient.callTool({
        name: toolName,
        arguments: args,
      });

      // Convert SDK result to our interface type
      return {
        content: Array.isArray(result.content)
          ? result.content.map(item => ({
              type: item.type,
              text: item.text as string | undefined,
              data: item.data as T,
              mimeType: item.mimeType,
              resource: item.resource
                ? {
                    name: item.resource.name,
                    description: item.resource.description || '',
                  }
                : undefined,
            }))
          : [],
      };
    } catch (error) {
      console.error(`MCP: Tool call failed: ${toolName}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * List available resources
   */
  async listResources(): Promise<string[]> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.listResources();
      return result.resources.map(resource => resource.uri);
    } catch (error) {
      console.error('MCP: Failed to list resources', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Read a resource
   * @param uri Resource URI
   */
  async readResource(uri: string): Promise<MCPResourceResult> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.readResource({ uri });

      return {
        contents: Array.isArray(result.contents)
          ? result.contents.map(item => ({
              uri: item.uri,
              text: item.text as string | undefined,
              data: item.data as any,
              mimeType: item.mimeType,
            }))
          : [],
      };
    } catch (error) {
      console.error(`MCP: Failed to read resource: ${uri}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Get a prompt
   * @param name Prompt name
   * @param args Prompt arguments
   */
  async getPrompt(name: string, args: Record<string, any>): Promise<MCPPromptResult> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.getPrompt({
        name: name,
        arguments: args,
      });

      return {
        messages: Array.isArray(result.messages)
          ? result.messages.map(message => ({
              role: message.role,
              content: {
                type: message.content.type,
                text: message.content.text as string | undefined,
              },
            }))
          : [],
      };
    } catch (error) {
      console.error(`MCP: Failed to get prompt: ${name}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Check if MCP is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
