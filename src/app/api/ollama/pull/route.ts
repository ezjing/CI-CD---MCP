import { NextRequest, NextResponse } from "next/server";
import { ollamaClient } from "@/lib/mcp/ollama-client";

export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json();

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Model name is required" },
        { status: 400 }
      );
    }

    const result = await ollamaClient.pullModel(model);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to pull Ollama model via API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
