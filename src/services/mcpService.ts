import { defineProxyService } from '@webext-core/proxy-service';
import {
  MCPClient,
  MCPTool,
  MCPToolResult,
  MCPResourceResult,
  MCPPromptResult,
} from '@/utils/mcpClient';
import { DONUT_MCP_SERVER_URL } from '@/constants/mcp';

/**
 * MCP Service
 * Responsible for communication with remote MCP server, providing tool calling functionality
 */
class MCPService {
  private client: MCPClient | null = null;
  private connecting = false;
  private connectionPromise: Promise<void> | null = null;
  private serverUrl: string | null = DONUT_MCP_SERVER_URL;
  private lastActivityTime: number = Date.now();
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private readonly CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

  constructor() {
    this.setupInactivityTimer();
  }

  /**
   * Initialize MCP client and connect to server
   * @param serverUrl MCP server URL
   */
  async connect(serverUrl: string): Promise<void> {
    // If already connecting, return existing Promise
    if (this.serverUrl === serverUrl && this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Save the server URL for potential reconnections
    this.serverUrl = serverUrl;

    // If already connected, reset timer and return
    if (this.client?.isConnected()) {
      this.markActivity();
      return Promise.resolve();
    }

    try {
      this.connecting = true;
      this.connectionPromise = this.initializeConnection(serverUrl);
      return this.connectionPromise;
    } catch (error) {
      this.connecting = false;
      this.connectionPromise = null;
      console.error('MCP connection initialization failed', error);
      throw this.normalizeError(error);
    }
  }

  /**
   * Create and initialize a connection
   * @private
   */
  private initializeConnection(serverUrl: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client = new MCPClient(serverUrl);
      this.client
        .connect()
        .then(() => {
          console.log('MCP service connected');
          this.markActivity();
          resolve();
        })
        .catch(error => {
          console.error('MCP service connection failed', error);
          this.client = null;
          reject(this.normalizeError(error));
        })
        .finally(() => {
          this.connecting = false;
          this.connectionPromise = null;
        });
    });
  }

  /**
   * Ensure client is connected before performing operations
   * @private
   */
  private async ensureConnected(): Promise<void> {
    // If already connected, mark activity and return
    if (this.client?.isConnected()) {
      this.markActivity();
      return;
    }

    // Attempt to connect if we have a server URL
    if (this.serverUrl) {
      console.log('MCP service not connected, attempting to connect automatically');
      await this.connect(this.serverUrl);
    } else {
      throw new Error('Cannot auto-connect: No server URL provided. Call connect() first.');
    }
  }

  /**
   * Mark activity to prevent timeout disconnection
   * @private
   */
  private markActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Setup the inactivity check timer
   * @private
   */
  private setupInactivityTimer(): void {
    // Clear any existing timer first
    this.clearInactivityTimer();

    // Create a new timer
    this.inactivityTimer = setInterval(() => this.checkInactivity(), this.CHECK_INTERVAL_MS);
  }

  /**
   * Check if the connection should be closed due to inactivity
   * @private
   */
  private checkInactivity(): void {
    const inactiveTime = Date.now() - this.lastActivityTime;

    if (this.client?.isConnected() && inactiveTime >= this.INACTIVITY_TIMEOUT_MS) {
      console.log(
        `Disconnecting MCP due to inactivity (${this.INACTIVITY_TIMEOUT_MS / 60000} minutes)`
      );
      this.disconnect();
    }
  }

  /**
   * Clear the inactivity timer
   * @private
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Normalize an error to Error type
   * @private
   */
  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Disconnect from MCP server
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Execute an MCP client method with connection handling
   * @private
   */
  private async executeClientMethod<T = any>(
    methodName: string,
    executor: (client: MCPClient) => Promise<T>
  ): Promise<T> {
    await this.ensureConnected();

    if (!this.client) {
      throw new Error('MCP service not connected');
    }

    this.markActivity();

    try {
      return await executor(this.client);
    } catch (error) {
      console.error(`MCP: ${methodName} failed`, error);
      throw this.normalizeError(error);
    }
  }

  /**
   * Get available MCP tools list
   */
  async getTools(): Promise<MCPTool[]> {
    return this.executeClientMethod('getTools', client => client.getTools());
  }

  /**
   * Refresh tools list
   */
  async refreshTools(): Promise<MCPTool[]> {
    return this.executeClientMethod('refreshTools', client => client.refreshTools());
  }

  /**
   * Call MCP tool
   * @param toolName Tool name
   * @param args Tool parameters
   */
  async callTool<T = any>(toolName: string, args: Record<string, any>): Promise<MCPToolResult<T>> {
    return this.executeClientMethod<MCPToolResult<T>>('callTool', client =>
      client.callTool(toolName, args)
    );
  }

  /**
   * List available resources
   */
  async listResources(): Promise<string[]> {
    return this.executeClientMethod('listResources', client => client.listResources());
  }

  /**
   * Read a resource
   * @param uri Resource URI
   */
  async readResource(uri: string): Promise<MCPResourceResult> {
    return this.executeClientMethod('readResource', client => client.readResource(uri));
  }

  /**
   * Get a prompt
   * @param name Prompt name
   * @param args Prompt arguments
   */
  async getPrompt(name: string, args: Record<string, any>): Promise<MCPPromptResult> {
    return this.executeClientMethod('getPrompt', client => client.getPrompt(name, args));
  }

  /**
   * Check if MCP is connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }
}

export const [registerMCPService, getMCPService] = defineProxyService(
  'mcpService',
  () => new MCPService()
);
