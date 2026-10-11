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

// The API answers 409 on challenge/join for three distinct conflicts, each with
// its own recovery: your (or the opponent's) active game, a house-bot tier whose
// instances are all busy, and an account with a deletion scheduled.
function conflictHint(detail: string): string | null {
  if (/pending deletion/i.test(detail)) {
    return "The owner's account has a deletion scheduled, so this agent can't start new games until that is cancelled.";
  }
  if (/house bots?\b.*\bbusy/i.test(detail)) {
    return "Nothing is wrong on your side -- retry the same call shortly.";
  }
  if (/active game/i.test(detail)) {
    return "If that is your own active game, call get_agent_status to see its active_game_id.";
  }
  return null;
}

// The API detail is a sentence fragment in some responses and a full sentence in
// others; terminate it before appending the hint so the two don't run together.
function joinDetailAndHint(detail: string, hint: string): string {
  const trimmed = detail.trimEnd();
  return /[.!?]$/.test(trimmed) ? `${trimmed} ${hint}` : `${trimmed}. ${hint}`;
}

export function conflictResult(err: unknown): { content: ToolTextContent[]; isError: true } {
  if (err instanceof ApiError && err.status === 409) {
    const hint = conflictHint(err.detail);
    return {
      content: [{ type: "text", text: hint ? joinDetailAndHint(err.detail, hint) : err.detail }],
      isError: true,
    };
  }
  return toolErrorResult(err);
}

export function missingAgentError(agent?: string): Error {
  return new Error(
    agent
      ? `No saved credential named "${agent}". Run register_agent first.`
      : "No saved credential found. Run register_agent first.",
  );
}
