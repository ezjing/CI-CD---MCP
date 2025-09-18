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
 * MCP 도구 목록을 관리하는 훅
 */
export function useMCPTools(): UseMCPToolsResult {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
 * MCP 도구 실행을 관리하는 훅
 */
export function useMCPExecution(): UseMCPExecutionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

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
 * MCP 컨텍스트를 관리하는 훅
 */
export function useMCPContext(contextType: string, query?: string) {
  const [context, setContext] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
