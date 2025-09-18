/**
 * MCP 클라이언트 테스트
 */

import { MCPClient } from "@/lib/mcp/client";

// Mock fetch
global.fetch = jest.fn();

describe("MCPClient", () => {
  let client: MCPClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new MCPClient("http://localhost:3000", "test-key");
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendRequest", () => {
    it("should send a request and return response", async () => {
      const mockResponse = {
        id: "test-id",
        type: "response",
        result: { success: true },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.sendRequest("test-method", {
        param: "value",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/mcp/request",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          },
          body: JSON.stringify({
            id: expect.any(String),
            type: "request",
            method: "test-method",
            params: { param: "value" },
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(client.sendRequest("test-method")).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.sendRequest("test-method")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getTools", () => {
    it("should fetch and return tools list", async () => {
      const mockTools = [
        {
          name: "test-tool",
          description: "Test tool",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test-id",
          type: "response",
          result: { tools: mockTools },
        }),
      } as Response);

      const tools = await client.getTools();

      expect(tools).toEqual(mockTools);
    });
  });

  describe("executeTool", () => {
    it("should execute a tool with parameters", async () => {
      const mockResult = { output: "test result" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test-id",
          type: "response",
          result: mockResult,
        }),
      } as Response);

      const result = await client.executeTool("test-tool", { input: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/mcp/request",
        expect.objectContaining({
          body: expect.stringContaining("tools/call"),
        })
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe("getContext", () => {
    it("should fetch context information", async () => {
      const mockContext = { type: "project", data: "test data" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test-id",
          type: "response",
          result: mockContext,
        }),
      } as Response);

      const context = await client.getContext("project", "test query");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/mcp/request",
        expect.objectContaining({
          body: expect.stringContaining("context/get"),
        })
      );

      expect(context).toEqual(mockContext);
    });
  });
});
