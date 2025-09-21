/**
 * MCP 요청을 처리하는 API 라우트
 */

import { NextRequest, NextResponse } from "next/server";
import { ollamaClient } from "@/lib/mcp/ollama-client";

export async function POST(request: NextRequest) {
  let body: { id?: string; method?: string; params?: Record<string, unknown> } =
    {};

  try {
    body = await request.json();

    // MCP 요청 검증
    if (!body.method) {
      return NextResponse.json(
        { error: "Method is required" },
        { status: 400 }
      );
    }

    // 실제 MCP 서버로 요청 전달 (여기서는 모의 구현)
    const result = await handleMCPRequest(body.method, body.params || {});

    return NextResponse.json({
      id: body.id,
      type: "response",
      result,
    });
  } catch (error) {
    console.error("MCP API error:", error);
    return NextResponse.json(
      {
        id: body?.id || "unknown",
        type: "error",
        error: {
          code: 500,
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

async function handleMCPRequest(
  method: string,
  params: Record<string, unknown>
) {
  switch (method) {
    case "tools/list":
      return {
        tools: [
          {
            name: "ollama_generate",
            description: "Ollama를 사용하여 텍스트 생성",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "생성할 텍스트의 프롬프트",
                },
                model: {
                  type: "string",
                  description: "사용할 모델명 (기본값: tinyllama)",
                },
                temperature: {
                  type: "number",
                  description: "온도 설정 (0.0-1.0)",
                },
                max_tokens: { type: "number", description: "최대 토큰 수" },
              },
              required: ["prompt"],
            },
          },
          {
            name: "ollama_chat",
            description: "Ollama를 사용하여 채팅",
            inputSchema: {
              type: "object",
              properties: {
                message: { type: "string", description: "사용자 메시지" },
                model: {
                  type: "string",
                  description: "사용할 모델명 (기본값: tinyllama)",
                },
                temperature: {
                  type: "number",
                  description: "온도 설정 (0.0-1.0)",
                },
              },
              required: ["message"],
            },
          },
          {
            name: "ollama_models",
            description: "사용 가능한 Ollama 모델 목록 조회",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "ollama_health",
            description: "Ollama 서버 상태 확인",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };

    case "tools/call":
      return await executeTool(
        params.name as string,
        params.arguments as Record<string, unknown>
      );

    case "context/get":
      return await getContext(params.type as string, params.query as string);

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function executeTool(toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    case "ollama_generate":
      try {
        const generateResult = await ollamaClient.generate({
          model: (args.model as string) || "tinyllama",
          prompt: args.prompt as string,
          options: {
            temperature: (args.temperature as number) || 0.7,
            num_predict: (args.max_tokens as number) || 500,
          },
        });
        return {
          success: true,
          response: generateResult.response,
          model: generateResult.model,
          duration: generateResult.total_duration,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Generation failed",
          timestamp: new Date().toISOString(),
        };
      }

    case "ollama_chat":
      try {
        const chatResult = await ollamaClient.chat({
          model: (args.model as string) || "tinyllama",
          messages: [{ role: "user", content: args.message as string }],
          options: {
            temperature: (args.temperature as number) || 0.7,
          },
        });

        return {
          success: true,
          response: chatResult.response,
          model: chatResult.model,
          duration: chatResult.total_duration,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Chat failed",
          timestamp: new Date().toISOString(),
        };
      }

    case "ollama_models":
      try {
        const models = await ollamaClient.getModels();
        return {
          success: true,
          models: models.map((model) => ({
            name: model.name,
            size: model.size,
            modified_at: model.modified_at,
            family: model.details.family,
          })),
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get models",
          timestamp: new Date().toISOString(),
        };
      }

    case "ollama_health":
      try {
        const isHealthy = await ollamaClient.healthCheck();
        return {
          success: true,
          healthy: isHealthy,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          healthy: false,
          error: error instanceof Error ? error.message : "Health check failed",
          timestamp: new Date().toISOString(),
        };
      }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function getContext(contextType: string, query?: string) {
  switch (contextType) {
    case "project":
      return {
        name: "nextjs-cicd-mcp-practice",
        version: "1.0.0",
        description: "CI/CD and MCP practice project",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
      };

    case "deployment":
      return {
        environments: ["staging", "production"],
        currentVersion: "1.0.0",
        lastDeployment: new Date().toISOString(),
      };

    default:
      return {
        type: contextType,
        query,
        data: "No specific context available",
      };
  }
}
