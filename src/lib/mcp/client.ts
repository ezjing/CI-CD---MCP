/**
 * MCP (Model Context Protocol) 클라이언트
 * AI 모델과의 통신을 위한 클라이언트 구현
 */

export interface MCPMessage {
  id: string;
  type: "request" | "response" | "error";
  method: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class MCPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * MCP 서버에 요청을 보냅니다
   */
  async sendRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    const message: MCPMessage = {
      id: this.generateId(),
      type: "request",
      method,
      params,
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("MCP request failed:", error);
      throw error;
    }
  }

  /**
   * 사용 가능한 도구 목록을 가져옵니다
   */
  async getTools(): Promise<MCPTool[]> {
    const result = (await this.sendRequest("tools/list")) as {
      tools?: MCPTool[];
    };
    return result.tools || [];
  }

  /**
   * 특정 도구를 실행합니다
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    return await this.sendRequest("tools/call", {
      name: toolName,
      arguments: parameters,
    });
  }

  /**
   * 컨텍스트 정보를 가져옵니다
   */
  async getContext(contextType: string, query?: string): Promise<unknown> {
    return await this.sendRequest("context/get", {
      type: contextType,
      query,
    });
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// 기본 MCP 클라이언트 인스턴스
export const mcpClient = new MCPClient(
  process.env.NEXT_PUBLIC_MCP_BASE_URL || "http://localhost:3000",
  process.env.MCP_API_KEY || "default-key"
);
