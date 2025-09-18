"use client";

import React, { useState, useEffect } from "react";
import { useMCPContext } from "@/lib/mcp/hooks";

interface DeploymentStatusProps {
  className?: string;
}

interface DeploymentInfo {
  environment: string;
  status: "deployed" | "deploying" | "failed" | "unknown";
  lastDeployment: string;
  version: string;
  health: "healthy" | "unhealthy" | "unknown";
}

export default function DeploymentStatus({
  className = "",
}: DeploymentStatusProps) {
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { context: deploymentContext } = useMCPContext("deployment");

  useEffect(() => {
    fetchDeploymentStatus();
  }, []);

  const fetchDeploymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // 실제로는 API에서 배포 상태를 가져옴
      const mockDeployments: DeploymentInfo[] = [
        {
          environment: "staging",
          status: "deployed",
          lastDeployment: new Date(
            Date.now() - 2 * 60 * 60 * 1000
          ).toISOString(),
          version: "1.0.0-staging",
          health: "healthy",
        },
        {
          environment: "production",
          status: "deployed",
          lastDeployment: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(),
          version: "1.0.0",
          health: "healthy",
        },
      ];

      setDeployments(mockDeployments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch deployment status"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "text-green-600 bg-green-100";
      case "deploying":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "unhealthy":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">배포 상태</h2>
        <button
          onClick={fetchDeploymentStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          오류: {error}
        </div>
      )}

      <div className="space-y-4">
        {deployments.map((deployment) => (
          <div
            key={deployment.environment}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {deployment.environment}
              </h3>
              <div className="flex space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    deployment.status
                  )}`}
                >
                  {deployment.status}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(
                    deployment.health
                  )}`}
                >
                  {deployment.health}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">버전:</span>
                <span className="ml-2 font-medium">{deployment.version}</span>
              </div>
              <div>
                <span className="text-gray-600">마지막 배포:</span>
                <span className="ml-2 font-medium">
                  {formatDate(deployment.lastDeployment)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex space-x-2">
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                로그 보기
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                메트릭 보기
              </button>
              {deployment.environment === "staging" && (
                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  프로덕션 배포
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {deploymentContext ? (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            MCP 컨텍스트 정보
          </h4>
          <pre className="text-xs text-blue-700 overflow-auto">
            {JSON.stringify(deploymentContext, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
