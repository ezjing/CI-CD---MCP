"use client";

import React, { useState } from "react";
import { useOllamaModels, useOllamaHealth } from "@/lib/mcp/use-ollama";
import { ollamaClient } from "@/lib/mcp/ollama-client";

interface OllamaModelManagerProps {
  className?: string;
}

export default function OllamaModelManager({
  className = "",
}: OllamaModelManagerProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState("");
  const [newModelName, setNewModelName] = useState("");

  const { models, isLoading, error, refreshModels } = useOllamaModels();
  const { isHealthy, checkHealth } = useOllamaHealth();

  // 컴포넌트 마운트 시 헬스 체크 실행
  React.useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handlePullModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || isPulling) return;

    setIsPulling(true);
    setPullProgress("모델 다운로드 중...");

    try {
      await ollamaClient.pullModel(newModelName.trim());
      setPullProgress("모델 다운로드 완료!");
      await refreshModels();
      setNewModelName("");
    } catch (error) {
      setPullProgress(
        `오류: ${error instanceof Error ? error.message : "모델 다운로드 실패"}`
      );
    } finally {
      setIsPulling(false);
      setTimeout(() => setPullProgress(""), 3000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ollama 모델 관리</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isHealthy === null
                ? "Checking..."
                : isHealthy
                ? "Connected"
                : "Disconnected"}
            </span>
          </div>
          <button
            onClick={refreshModels}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {/* 새 모델 다운로드 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">새 모델 다운로드</h3>
        <form onSubmit={handlePullModel} className="flex space-x-2">
          <input
            type="text"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="모델명 (예: llama3, codellama, mistral)"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPulling || !isHealthy}
          />
          <button
            type="submit"
            disabled={!newModelName.trim() || isPulling || !isHealthy}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isPulling ? "다운로드 중..." : "다운로드"}
          </button>
        </form>

        {pullProgress && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-sm">
            {pullProgress}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 모델 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">사용 가능한 모델</h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-gray-600">모델 목록을 불러오는 중...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>설치된 모델이 없습니다.</p>
            <p className="text-sm mt-1">위에서 새 모델을 다운로드해보세요.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <div
                key={model.name}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {model.name}
                  </h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {model.details.family}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>크기:</span>
                    <span>{formatFileSize(model.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>형식:</span>
                    <span>{model.details.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>수정일:</span>
                    <span>{formatDate(model.modified_at)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    <div>Parameter Size: {model.details.parameter_size}</div>
                    <div>Quantization: {model.details.quantization_level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
