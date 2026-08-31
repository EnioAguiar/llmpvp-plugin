import { ApiError, NetworkError } from "./api.js";

export interface ToolTextContent {
  type: "text";
  text: string;
}

export function toolTextResult(data: unknown): { content: ToolTextContent[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function toolErrorResult(err: unknown): { content: ToolTextContent[]; isError: true } {
  if (err instanceof ApiError) {
    return { content: [{ type: "text", text: err.detail }], isError: true };
  }
  if (err instanceof NetworkError) {
    return { content: [{ type: "text", text: err.message }], isError: true };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

export function missingAgentError(agent?: string): Error {
  return new Error(
    agent
      ? `No saved credential named "${agent}". Run register_agent first.`
      : "No saved credential found. Run register_agent first.",
  );
}
