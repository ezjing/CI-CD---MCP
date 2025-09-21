/**
 * MCP (Model Context Protocol)(AI 모델과의 표준화된 통신 프로토콜) 클라이언트
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

  // baseUrl과 apiKey를 받아 MCP 서버와 통신할 준비를 합니다.
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * MCP 서버에 method와 params를 담아 POST 요청을 보냅니다.
   * 고유 ID를 생성해 메시지에 포함시키고, 응답이 실패하면 에러를 throw합니다.
   * 성공 시 JSON 결과를 반환합니다.
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
      const response = await fetch(`${this.baseUrl}/api/mcp/request`, {
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
   * sendRequest로 "tools/list"를 호출해 사용 가능한 도구 목록을 받아옵니다.
   * 결과에서 tools 배열을 반환하며, 없으면 빈 배열을 반환합니다.
   */
  async getTools(): Promise<MCPTool[]> {
    const result = (await this.sendRequest("tools/list")) as {
      result?: {
        tools?: MCPTool[];
      };
    };
    return result.result?.tools || [];
  }

  /**
   * sendRequest로 "tools/call"을 호출해 특정 도구(toolName)를 주어진 파라미터(parameters)로 실행합니다.
   * 실행 결과를 반환합니다.
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    const result = await this.sendRequest("tools/call", {
      name: toolName,
      arguments: parameters,
    });
    return (result as { result?: unknown }).result;
  }

  /**
   * sendRequest로 "context/get"을 호출해 contextType과 query에 해당하는 컨텍스트 정보를 받아옵니다.
   */
  async getContext(contextType: string, query?: string): Promise<unknown> {
    const result = await this.sendRequest("context/get", {
      type: contextType,
      query,
    });
    return (result as { result?: unknown }).result;
  }

  /**
   * 임의의 문자열을 생성해 각 요청에 고유 ID로 사용합니다.
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// 환경변수에서 MCP 서버 주소와 API 키를 받아 기본 MCPClient 인스턴스를 생성해 export합니다.
export const mcpClient = new MCPClient(
  process.env.NEXT_PUBLIC_MCP_BASE_URL || "http://localhost:3000",
  process.env.MCP_API_KEY || "default-key"
);
