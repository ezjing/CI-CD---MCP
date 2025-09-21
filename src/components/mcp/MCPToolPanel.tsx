"use client";

import React, { useState, useEffect } from "react";
import { useMCPTools, useMCPExecution } from "@/lib/mcp/hooks";

interface MCPToolPanelProps {
  className?: string;
}

export default function MCPToolPanel({ className = "" }: MCPToolPanelProps) {
  // MCP 도구 목록, 로딩/에러 상태, 새로고침 함수 제공
  const {
    tools,
    loading: toolsLoading,
    error: toolsError,
    refreshTools,
  } = useMCPTools();

  // MCP 도구 실행 함수, 실행 중/에러 상태 제공
  const {
    executeTool,
    loading: executionLoading,
    error: executionError,
  } = useMCPExecution();

  // 선택된 도구 이름 상태
  const [selectedTool, setSelectedTool] = useState<string>("");
  // 도구 실행 파라미터 상태
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  // 도구 실행 결과 상태
  const [executionResult, setExecutionResult] = useState<unknown>(null);
  // 사용 가능한 모델 목록 상태
  const [availableModels, setAvailableModels] = useState<
    Array<{
      name: string;
      size: number;
      modified_at: string;
      family: string;
    }>
  >([]);
  // 모델 로딩 상태
  const [modelsLoading, setModelsLoading] = useState(false);

  /**
   * 사용 가능한 모델 목록을 가져오는 함수
   */
  const loadAvailableModels = async () => {
    try {
      setModelsLoading(true);
      const result = await executeTool("ollama_models", {});
      if (result && typeof result === "object" && "models" in result) {
        const models = (
          result as {
            models: Array<{
              name: string;
              size: number;
              modified_at: string;
              family: string;
            }>;
          }
        ).models;
        setAvailableModels(models);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setModelsLoading(false);
    }
  };

  /**
   * 도구를 선택했을 때 호출되는 함수
   * - 선택된 도구 이름을 설정하고, 파라미터와 실행 결과를 초기화함
   */
  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setParameters({});
    setExecutionResult(null);
  };

  /**
   * 파라미터 입력값이 변경될 때 호출되는 함수
   * - 해당 파라미터 값을 상태에 반영함
   * - 스키마에 따라 적절한 타입으로 변환
   */
  const handleParameterChange = (key: string, value: string) => {
    if (!selectedToolInfo) return;

    const schema = selectedToolInfo.inputSchema.properties[key] as {
      type?: string;
    };
    let convertedValue: unknown = value;

    // 스키마 타입에 따라 값 변환
    if (schema?.type === "number") {
      if (value === "") {
        convertedValue = undefined;
      } else {
        const numValue = Number(value);
        // 음수 방지
        if (numValue < 0) {
          return; // 음수는 무시
        }

        // 필드별 최대값 검증
        if (key === "temperature" && numValue > 1.0) {
          return; // temperature는 1.0 초과 불가
        }
        if (key === "max_tokens" && numValue > 500) {
          return; // max_tokens는 500 초과 불가
        }

        // 소수점 처리
        let roundedValue = numValue;
        if (key === "temperature") {
          // temperature는 소수점 첫째자리까지만 허용
          roundedValue = Math.round(numValue * 10) / 10;
        } else if (key === "max_tokens") {
          // max_tokens는 정수만 허용
          roundedValue = Math.round(numValue);
        } else {
          // 기타 숫자 필드는 소수점 첫째자리까지만 허용
          roundedValue = Math.round(numValue * 10) / 10;
        }

        convertedValue = roundedValue;
      }
    } else if (schema?.type === "boolean") {
      convertedValue = value === "true";
    }

    setParameters((prev) => ({
      ...prev,
      [key]: convertedValue,
    }));
  };

  /**
   * 도구 실행 버튼 클릭 시 호출되는 함수
   * - 선택된 도구와 파라미터로 도구를 실행하고 결과를 저장함
   */
  const handleExecute = async () => {
    if (!selectedTool) return;

    try {
      const result = await executeTool(selectedTool, parameters);
      setExecutionResult(result);
    } catch (error) {
      console.error("Tool execution failed:", error);
    }
  };

  // 컴포넌트 마운트 시 모델 목록 로드
  useEffect(() => {
    loadAvailableModels();
  }, []);

  // 현재 선택된 도구의 상세 정보
  const selectedToolInfo = tools.find((tool) => tool.name === selectedTool);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">MCP 도구 패널</h2>
          <div className="mt-2 text-sm text-gray-800">
            <span className="font-semibold">사용 가능한 모델:</span>
            {modelsLoading ? (
              <span className="ml-2 text-blue-700 font-medium">로딩 중...</span>
            ) : availableModels.length > 0 ? (
              <span className="ml-2 text-gray-900 font-medium">
                {availableModels.map((model) => model.name).join(", ")}
              </span>
            ) : (
              <span className="ml-2 text-gray-600 font-medium">
                모델 정보 없음
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAvailableModels}
            disabled={modelsLoading}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            {modelsLoading ? "모델 로딩..." : "모델 새로고침"}
          </button>
          <button
            onClick={refreshTools}
            disabled={toolsLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {toolsLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            사용 가능한 도구
          </h3>
          {toolsLoading ? (
            <div className="text-gray-700 font-medium">
              도구 목록을 불러오는 중...
            </div>
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
                  <div className="font-semibold text-gray-900">{tool.name}</div>
                  <div className="text-sm text-gray-800">
                    {tool.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 도구 실행 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">도구 실행</h3>
          {selectedToolInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  선택된 도구: {selectedToolInfo.name}
                </label>
                <p className="text-sm text-gray-800 mb-4">
                  {selectedToolInfo.description}
                </p>
              </div>

              {/* 매개변수 입력 */}
              <div className="space-y-3">
                {Object.entries(selectedToolInfo.inputSchema.properties).map(
                  ([key, schema]: [string, unknown]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        {key}{" "}
                        {selectedToolInfo.inputSchema.required?.includes(key) &&
                          "*"}
                      </label>
                      <input
                        type={
                          (schema as { type?: string }).type === "number"
                            ? "number"
                            : "text"
                        }
                        step={
                          (schema as { type?: string }).type === "number"
                            ? key === "temperature"
                              ? "0.1"
                              : key === "max_tokens"
                              ? "1"
                              : "0.1"
                            : undefined
                        }
                        min={
                          (schema as { type?: string }).type === "number"
                            ? "0"
                            : undefined
                        }
                        max={
                          (schema as { type?: string }).type === "number"
                            ? key === "temperature"
                              ? "1.0"
                              : key === "max_tokens"
                              ? "500"
                              : undefined
                            : undefined
                        }
                        value={
                          parameters[key] !== undefined
                            ? String(parameters[key])
                            : ""
                        }
                        onChange={(e) =>
                          handleParameterChange(key, e.target.value)
                        }
                        placeholder={
                          (schema as { description?: string }).description ||
                          `Enter ${key}`
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
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
            <div className="text-gray-700 font-semibold">도구를 선택하세요</div>
          )}
        </div>
      </div>

      {/* 모델 정보 섹션 */}
      {availableModels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            사용 가능한 AI 모델
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableModels.map((model, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                <div className="font-bold text-gray-900">{model.name}</div>
                <div className="text-sm text-gray-800 mt-1">
                  <div className="font-medium">패밀리: {model.family}</div>
                  <div className="font-medium">
                    크기: {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                  </div>
                  <div className="text-xs text-gray-700 font-medium">
                    수정일:{" "}
                    {new Date(model.modified_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {executionResult ? (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">실행 결과</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm text-gray-800 font-mono">
            {JSON.stringify(executionResult, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
