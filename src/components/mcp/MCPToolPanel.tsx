"use client";

import React, { useState } from "react";
import { useMCPTools, useMCPExecution } from "@/lib/mcp/hooks";

interface MCPToolPanelProps {
  className?: string;
}

export default function MCPToolPanel({ className = "" }: MCPToolPanelProps) {
  const {
    tools,
    loading: toolsLoading,
    error: toolsError,
    refreshTools,
  } = useMCPTools();
  const {
    executeTool,
    loading: executionLoading,
    error: executionError,
  } = useMCPExecution();
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [executionResult, setExecutionResult] = useState<unknown>(null);

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setParameters({});
    setExecutionResult(null);
  };

  const handleParameterChange = (key: string, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExecute = async () => {
    if (!selectedTool) return;

    try {
      const result = await executeTool(selectedTool, parameters);
      setExecutionResult(result);
    } catch (error) {
      console.error("Tool execution failed:", error);
    }
  };

  const selectedToolInfo = tools.find((tool) => tool.name === selectedTool);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">MCP 도구 패널</h2>
        <button
          onClick={refreshTools}
          disabled={toolsLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {toolsLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {toolsError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          오류: {toolsError}
        </div>
      )}

      {executionError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          실행 오류: {executionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 도구 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">사용 가능한 도구</h3>
          {toolsLoading ? (
            <div className="text-gray-500">도구 목록을 불러오는 중...</div>
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => handleToolSelect(tool.name)}
                  className={`w-full text-left p-3 rounded border ${
                    selectedTool === tool.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-sm text-gray-600">
                    {tool.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 도구 실행 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">도구 실행</h3>
          {selectedToolInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선택된 도구: {selectedToolInfo.name}
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedToolInfo.description}
                </p>
              </div>

              {/* 매개변수 입력 */}
              <div className="space-y-3">
                {Object.entries(selectedToolInfo.inputSchema.properties).map(
                  ([key, schema]: [string, unknown]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}{" "}
                        {selectedToolInfo.inputSchema.required?.includes(key) &&
                          "*"}
                      </label>
                      <input
                        type="text"
                        value={String(parameters[key] || "")}
                        onChange={(e) =>
                          handleParameterChange(key, e.target.value)
                        }
                        placeholder={
                          (schema as { description?: string }).description ||
                          `Enter ${key}`
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )
                )}
              </div>

              <button
                onClick={handleExecute}
                disabled={executionLoading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {executionLoading ? "실행 중..." : "도구 실행"}
              </button>
            </div>
          ) : (
            <div className="text-gray-500">도구를 선택하세요</div>
          )}
        </div>
      </div>

      {executionResult ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">실행 결과</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(executionResult, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
