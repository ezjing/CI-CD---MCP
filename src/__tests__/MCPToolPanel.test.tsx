/**
 * MCPToolPanel 컴포넌트 테스트
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MCPToolPanel from "@/components/mcp/MCPToolPanel";

// Mock MCP hooks
jest.mock("@/lib/mcp/hooks", () => ({
  useMCPTools: () => ({
    tools: [
      {
        name: "test-tool",
        description: "Test tool description",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Test query" },
          },
          required: ["query"],
        },
      },
    ],
    loading: false,
    error: null,
    refreshTools: jest.fn(),
  }),
  useMCPExecution: () => ({
    executeTool: jest.fn().mockResolvedValue({ result: "test result" }),
    loading: false,
    error: null,
    result: null,
  }),
}));

describe("MCPToolPanel", () => {
  it("renders tool panel with tools list", () => {
    render(<MCPToolPanel />);

    expect(screen.getByText("MCP 도구 패널")).toBeInTheDocument();
    expect(screen.getByText("사용 가능한 도구")).toBeInTheDocument();
    expect(screen.getByText("test-tool")).toBeInTheDocument();
    expect(screen.getByText("Test tool description")).toBeInTheDocument();
  });

  it("allows tool selection", async () => {
    const user = userEvent.setup();
    render(<MCPToolPanel />);

    const toolButton = screen.getByText("test-tool");
    await user.click(toolButton);

    expect(screen.getByText("선택된 도구: test-tool")).toBeInTheDocument();
    expect(screen.getByText("Test tool description")).toBeInTheDocument();
  });

  it("shows parameter input for selected tool", async () => {
    const user = userEvent.setup();
    render(<MCPToolPanel />);

    const toolButton = screen.getByText("test-tool");
    await user.click(toolButton);

    expect(screen.getByLabelText("query *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter query")).toBeInTheDocument();
  });

  it("executes tool with parameters", async () => {
    const user = userEvent.setup();
    const mockExecuteTool = jest
      .fn()
      .mockResolvedValue({ result: "test result" });

    // Mock the hook to return our mock function
    jest.doMock("@/lib/mcp/hooks", () => ({
      useMCPTools: () => ({
        tools: [
          {
            name: "test-tool",
            description: "Test tool description",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Test query" },
              },
              required: ["query"],
            },
          },
        ],
        loading: false,
        error: null,
        refreshTools: jest.fn(),
      }),
      useMCPExecution: () => ({
        executeTool: mockExecuteTool,
        loading: false,
        error: null,
        result: null,
      }),
    }));

    render(<MCPToolPanel />);

    // Select tool
    const toolButton = screen.getByText("test-tool");
    await user.click(toolButton);

    // Enter parameter
    const input = screen.getByLabelText("query *");
    await user.type(input, "test query");

    // Execute tool
    const executeButton = screen.getByText("도구 실행");
    await user.click(executeButton);

    await waitFor(() => {
      expect(mockExecuteTool).toHaveBeenCalledWith("test-tool", {
        query: "test query",
      });
    });
  });

  it("shows loading state", () => {
    jest.doMock("@/lib/mcp/hooks", () => ({
      useMCPTools: () => ({
        tools: [],
        loading: true,
        error: null,
        refreshTools: jest.fn(),
      }),
      useMCPExecution: () => ({
        executeTool: jest.fn(),
        loading: false,
        error: null,
        result: null,
      }),
    }));

    render(<MCPToolPanel />);

    expect(screen.getByText("도구 목록을 불러오는 중...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    jest.doMock("@/lib/mcp/hooks", () => ({
      useMCPTools: () => ({
        tools: [],
        loading: false,
        error: "Failed to fetch tools",
        refreshTools: jest.fn(),
      }),
      useMCPExecution: () => ({
        executeTool: jest.fn(),
        loading: false,
        error: null,
        result: null,
      }),
    }));

    render(<MCPToolPanel />);

    expect(screen.getByText("오류: Failed to fetch tools")).toBeInTheDocument();
  });
});
