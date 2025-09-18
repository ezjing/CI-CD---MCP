"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useOllamaChat,
  useOllamaModels,
  useOllamaHealth,
} from "@/lib/mcp/use-ollama";

interface OllamaChatProps {
  className?: string;
}

export default function OllamaChat({ className = "" }: OllamaChatProps) {
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    models,
    isLoading: modelsLoading,
    error: modelsError,
    refreshModels,
  } = useOllamaModels();
  const { isHealthy, isChecking, checkHealth } = useOllamaHealth();
  const {
    messages,
    sendMessageStream,
    isGenerating,
    error: chatError,
    clearChat,
  } = useOllamaChat(selectedModel);

  // 컴포넌트 마운트 시 모델 목록과 헬스 체크
  useEffect(() => {
    refreshModels();
    checkHealth();
  }, [refreshModels, checkHealth]);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const message = inputMessage.trim();
    setInputMessage("");
    await sendMessageStream(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Ollama Chat</h2>
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
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
            disabled={modelsLoading}
          >
            {modelsLoading ? (
              <option>Loading models...</option>
            ) : (
              models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({Math.round(model.size / 1024 / 1024 / 1024)}GB)
                </option>
              ))
            )}
          </select>

          <button
            onClick={refreshModels}
            disabled={modelsLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {(modelsError || chatError) && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">{modelsError || chatError}</p>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ollama와 대화를 시작해보세요!</p>
            <p className="text-sm mt-2">
              메시지를 입력하고 Enter를 누르거나 전송 버튼을 클릭하세요.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                <span>생성 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 폼 */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isGenerating || !isHealthy}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isGenerating || !isHealthy}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "전송 중..." : "전송"}
          </button>
        </form>
      </div>
    </div>
  );
}
