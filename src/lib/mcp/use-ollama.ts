/**
 * Ollama API를 사용하는 React 훅들
 */

import { useState, useCallback, useRef } from "react";
import {
  ollamaClient,
  OllamaModel,
  OllamaGenerateRequest,
  OllamaChatRequest,
  OllamaGenerateResponse,
} from "./ollama-client";

export interface UseOllamaModelsReturn {
  models: OllamaModel[];
  isLoading: boolean;
  error: string | null;
  refreshModels: () => Promise<void>;
}

export interface UseOllamaGenerateReturn {
  generate: (request: Omit<OllamaGenerateRequest, "model">) => Promise<void>;
  generateStream: (
    request: Omit<OllamaGenerateRequest, "model">
  ) => Promise<void>;
  response: string;
  isGenerating: boolean;
  error: string | null;
  clearResponse: () => void;
}

export interface UseOllamaChatReturn {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  clearChat: () => void;
}

/**
 * Ollama 모델 목록을 관리하는 훅
 */
export function useOllamaModels(): UseOllamaModelsReturn {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ollama/models");
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      } else {
        setError(data.error || "Failed to fetch models");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    models,
    isLoading,
    error,
    refreshModels,
  };
}

/**
 * Ollama 텍스트 생성을 위한 훅
 */
export function useOllamaGenerate(
  model: string = "llama3"
): UseOllamaGenerateReturn {
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (request: Omit<OllamaGenerateRequest, "model">) => {
      setIsGenerating(true);
      setError(null);
      setResponse("");

      try {
        const result = await ollamaClient.generate({
          ...request,
          model,
        });
        setResponse(result.response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setIsGenerating(false);
      }
    },
    [model]
  );

  const generateStream = useCallback(
    async (request: Omit<OllamaGenerateRequest, "model">) => {
      setIsGenerating(true);
      setError(null);
      setResponse("");

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        await ollamaClient.generateStream(
          {
            ...request,
            model,
          },
          (chunk) => {
            if (abortControllerRef.current?.signal.aborted) return;
            setResponse((prev) => prev + chunk.response);
          }
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // 취소된 요청은 에러로 처리하지 않음
        }
        setError(
          err instanceof Error ? err.message : "Streaming generation failed"
        );
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [model]
  );

  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    generate,
    generateStream,
    response,
    isGenerating,
    error,
    clearResponse,
  };
}

/**
 * Ollama 채팅을 위한 훅
 */
export function useOllamaChat(model: string = "llama3"): UseOllamaChatReturn {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage = {
        role: "user" as const,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setError(null);

      try {
        const chatMessages = [...messages, userMessage].map(
          ({ role, content }) => ({ role, content })
        );
        const result = await ollamaClient.chat({
          model,
          messages: chatMessages,
        });

        const assistantMessage = {
          role: "assistant" as const,
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat failed");
      } finally {
        setIsGenerating(false);
      }
    },
    [model, messages]
  );

  const sendMessageStream = useCallback(
    async (content: string) => {
      const userMessage = {
        role: "user" as const,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setError(null);

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const chatMessages = [...messages, userMessage].map(
          ({ role, content }) => ({ role, content })
        );
        let assistantResponse = "";

        await ollamaClient.chatStream(
          {
            model,
            messages: chatMessages,
          },
          (chunk) => {
            if (abortControllerRef.current?.signal.aborted) return;
            assistantResponse += chunk.response;

            // 마지막 메시지를 업데이트하거나 새로 추가
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];

              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content = assistantResponse;
              } else {
                newMessages.push({
                  role: "assistant",
                  content: assistantResponse,
                  timestamp: new Date(),
                });
              }

              return newMessages;
            });
          }
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // 취소된 요청은 에러로 처리하지 않음
        }
        setError(err instanceof Error ? err.message : "Streaming chat failed");
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [model, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    sendMessage,
    sendMessageStream,
    isGenerating,
    error,
    clearChat,
  };
}

/**
 * Ollama 서버 상태를 확인하는 훅
 */
export function useOllamaHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/ollama/health");
      const data = await response.json();
      setIsHealthy(data.healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isHealthy,
    isChecking,
    checkHealth,
  };
}

/**
 * Ollama 모델 다운로드를 위한 훅
 */
export function useOllamaPull() {
  const [isPulling, setIsPulling] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pullModel = useCallback(async (modelName: string) => {
    setIsPulling(true);
    setError(null);
    setProgress("모델 다운로드 중...");

    try {
      const response = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: modelName }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress("모델 다운로드 완료!");
        return data.result;
      } else {
        throw new Error(data.error || "Failed to pull model");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Pull failed";
      setError(errorMessage);
      setProgress(`오류: ${errorMessage}`);
      throw err;
    } finally {
      setIsPulling(false);
      setTimeout(() => {
        setProgress("");
        setError(null);
      }, 3000);
    }
  }, []);

  return {
    isPulling,
    progress,
    error,
    pullModel,
  };
}
