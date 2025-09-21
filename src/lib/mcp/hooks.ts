/**
 * MCP 관련 React 훅들
 */

import { useState, useEffect, useCallback } from "react";
import { mcpClient, MCPTool } from "./client";

export interface UseMCPToolsResult {
  tools: MCPTool[];
  loading: boolean;
  error: string | null;
  refreshTools: () => Promise<void>;
}

export interface UseMCPExecutionResult {
  executeTool: (
    toolName: string,
    parameters: Record<string, unknown>
  ) => Promise<unknown>;
  loading: boolean;
  error: string | null;
  result: unknown;
}

/**
 * MCP 도구 목록을 가져오고 상태를 관리하는 커스텀 훅입니다.
 * - tools: MCPTool[] 형태의 도구 목록
 * - loading: 로딩 상태
 * - error: 에러 메시지
 * - refreshTools: 도구 목록을 새로고침하는 함수
 */
export function useMCPTools(): UseMCPToolsResult {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MCP 서버에서 도구 목록을 새로 불러오는 함수
  const refreshTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const toolsList = await mcpClient.getTools();
      setTools(toolsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tools");
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 도구 목록을 자동으로 불러옴
  useEffect(() => {
    refreshTools();
  }, [refreshTools]);

  return {
    tools,
    loading,
    error,
    refreshTools,
  };
}

/**
 * MCP 도구 실행을 관리하는 커스텀 훅입니다.
 * - executeTool: 도구 이름과 파라미터를 받아 실행하는 함수
 * - loading: 실행 중 여부
 * - error: 에러 메시지
 * - result: 실행 결과
 */
export function useMCPExecution(): UseMCPExecutionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  // MCP 도구를 실행하는 함수
  const executeTool = useCallback(
    async (toolName: string, parameters: Record<string, unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const toolResult = await mcpClient.executeTool(toolName, parameters);
        setResult(toolResult);
        return toolResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Tool execution failed";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    executeTool,
    loading,
    error,
    result,
  };
}

/**
 * MCP 컨텍스트 정보를 가져오고 관리하는 커스텀 훅입니다.
 * - contextType: 가져올 컨텍스트 타입
 * - query: (선택) 쿼리 문자열
 * - context: 받아온 컨텍스트 데이터
 * - loading: 로딩 상태
 * - error: 에러 메시지
 * - refetch: 컨텍스트를 다시 불러오는 함수
 */
export function useMCPContext(contextType: string, query?: string) {
  const [context, setContext] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MCP 서버에서 컨텍스트 정보를 불러오는 함수
  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contextData = await mcpClient.getContext(contextType, query);
      setContext(contextData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch context");
    } finally {
      setLoading(false);
    }
  }, [contextType, query]);

  // contextType이 변경될 때마다 컨텍스트 정보를 자동으로 불러옴
  useEffect(() => {
    if (contextType) {
      fetchContext();
    }
  }, [contextType, query, fetchContext]);

  return {
    context,
    loading,
    error,
    refetch: fetchContext,
  };
}
