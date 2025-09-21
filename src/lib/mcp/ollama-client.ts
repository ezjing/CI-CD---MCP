/**
 * Ollama API 클라이언트
 * Ollama 서버와의 통신을 위한 클라이언트 구현
 */

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    stop?: string[];
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    stop?: string[];
    num_predict?: number;
  };
}

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = "http://localhost:11434",
    defaultModel: string = "llama3"
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  /**
   * Ollama 서버 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `Ollama health check failed: ${response.status} ${response.statusText}`
        );
        return false;
      }

      const data = await response.json();
      return data && data.models;
    } catch (error) {
      console.error("Ollama health check failed:", error);
      return false;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Failed to get models:", error);
      throw error;
    }
  }

  /**
   * 특정 모델 정보 조회
   */
  async getModel(modelName: string): Promise<OllamaModel | null> {
    try {
      const models = await this.getModels();
      return models.find((model) => model.name === modelName) || null;
    } catch (error) {
      console.error(`Failed to get model ${modelName}:`, error);
      return null;
    }
  }

  /**
   * 모델 생성 (스트리밍)
   */
  async generateStream(
    request: OllamaGenerateRequest,
    onChunk?: (chunk: OllamaGenerateResponse) => void
  ): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let fullResponse = "";
    let lastResponse: OllamaGenerateResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
            }

            if (data.done) {
              lastResponse = {
                ...data,
                response: fullResponse,
              };
            }

            if (onChunk) {
              onChunk(data);
            }
          } catch (parseError) {
            console.warn("Failed to parse chunk:", parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return (
      lastResponse || {
        model: request.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true,
      }
    );
  }

  /**
   * 모델 생성 (비스트리밍)
   */
  async generate(
    request: OllamaGenerateRequest
  ): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 채팅 (스트리밍)
   */
  async chatStream(
    request: OllamaChatRequest,
    onChunk?: (chunk: OllamaGenerateResponse) => void
  ): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let fullResponse = "";
    let lastResponse: OllamaGenerateResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
            }

            if (data.done) {
              lastResponse = {
                model: data.model,
                created_at: data.created_at,
                response: fullResponse,
                done: true,
                total_duration: data.total_duration,
                load_duration: data.load_duration,
                prompt_eval_count: data.prompt_eval_count,
                prompt_eval_duration: data.prompt_eval_duration,
                eval_count: data.eval_count,
                eval_duration: data.eval_duration,
              };
            }

            if (onChunk) {
              onChunk({
                model: data.model,
                created_at: data.created_at,
                response: data.message?.content || "",
                done: data.done,
                total_duration: data.total_duration,
                load_duration: data.load_duration,
                prompt_eval_count: data.prompt_eval_count,
                prompt_eval_duration: data.prompt_eval_duration,
                eval_count: data.eval_count,
                eval_duration: data.eval_duration,
              });
            }
          } catch (parseError) {
            console.warn("Failed to parse chunk:", parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return (
      lastResponse || {
        model: request.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true,
      }
    );
  }

  /**
   * 채팅 (비스트리밍)
   */
  async chat(request: OllamaChatRequest): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      model: data.model,
      created_at: data.created_at,
      response: data.message?.content || "",
      done: true,
      total_duration: data.total_duration,
      load_duration: data.load_duration,
      prompt_eval_count: data.prompt_eval_count,
      prompt_eval_duration: data.prompt_eval_duration,
      eval_count: data.eval_count,
      eval_duration: data.eval_duration,
    };
  }

  /**
   * 모델 풀링 (다운로드)
   */
  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 스트리밍 응답 처리
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === "success") {
              return;
            }
          } catch (parseError) {
            console.warn("Failed to parse pull response:", parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// 기본 Ollama 클라이언트 인스턴스
export const ollamaClient = new OllamaClient(
  process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434",
  process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || "tinyllama"
);
