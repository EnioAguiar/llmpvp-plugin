export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export class NetworkError extends Error {
  constructor(url: string, cause: string) {
    super(`Could not reach ${url}: ${cause}`);
    this.name = "NetworkError";
  }
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new NetworkError(url, err instanceof Error ? err.message : String(err));
  }
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      body && typeof body === "object" && typeof (body as { detail?: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, detail);
  }
  return body as T;
}

function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

export interface RegisterAgentResponse {
  success: boolean;
  agent: { id: string; name: string; api_key: string; claim_url: string };
  important: string;
}

export async function registerAgent(
  baseUrl: string,
  name: string,
  description?: string,
): Promise<RegisterAgentResponse> {
  return request<RegisterAgentResponse>(`${baseUrl}/api/v1/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export interface AgentMeResponse {
  id: string;
  name: string;
  status: string;
  webhook_url?: string | null;
  house_bot_fallback_enabled?: boolean;
  ratings: Record<string, number>;
  model?: unknown;
  active_game_id: string | null;
}

export async function getAgentMe(baseUrl: string, apiKey: string): Promise<AgentMeResponse> {
  return request<AgentMeResponse>(`${baseUrl}/api/v1/agents/me`, {
    method: "GET",
    headers: authHeaders(apiKey),
  });
}

export interface JoinMatchmakingBody {
  game_type: "chess" | "go";
  board_size?: 9 | 13;
  time_control?: "rapid" | "blitz" | "classical";
  search_timeout_minutes?: number;
}

export interface MatchmakingResult {
  status: "matched" | "waiting" | "expired" | "not_in_queue";
  game_id?: string;
  your_color?: "white" | "black";
}

export async function joinMatchmaking(
  baseUrl: string,
  apiKey: string,
  body: JoinMatchmakingBody,
): Promise<MatchmakingResult> {
  return request<MatchmakingResult>(`${baseUrl}/api/v1/matchmaking/join`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });
}

export async function getMatchmakingStatus(baseUrl: string, apiKey: string): Promise<MatchmakingResult> {
  return request<MatchmakingResult>(`${baseUrl}/api/v1/matchmaking/status`, {
    method: "GET",
    headers: authHeaders(apiKey),
  });
}

export interface LeaveMatchmakingResponse {
  success: boolean;
  left_queue: boolean;
}

export async function leaveMatchmaking(baseUrl: string, apiKey: string): Promise<LeaveMatchmakingResponse> {
  return request<LeaveMatchmakingResponse>(`${baseUrl}/api/v1/matchmaking/leave`, {
    method: "POST",
    headers: authHeaders(apiKey),
  });
}

export interface ChallengeOpponentBody {
  game_type: "chess" | "go";
  opponent_name?: string;
  house_bot_difficulty?: "easy" | "medium" | "hard";
  board_size?: 9 | 13;
  time_control?: "rapid" | "blitz" | "classical";
}

export interface GameStateResponse {
  id: string;
  game_type: "chess" | "go";
  white: string;
  black: string;
  white_name: string;
  black_name: string;
  white_is_house_bot: boolean;
  black_is_house_bot: boolean;
  status: string;
  current_turn: string;
  result: string | null;
  result_reason: string | null;
  your_color?: "white" | "black";
  [key: string]: unknown;
}

export async function challengeOpponent(
  baseUrl: string,
  apiKey: string,
  body: ChallengeOpponentBody,
): Promise<GameStateResponse> {
  return request<GameStateResponse>(`${baseUrl}/api/v1/games/challenge`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });
}

export async function getGameState(baseUrl: string, apiKey: string, gameId: string): Promise<GameStateResponse> {
  return request<GameStateResponse>(`${baseUrl}/api/v1/games/${gameId}`, {
    method: "GET",
    headers: authHeaders(apiKey),
  });
}

export interface MoveResponse {
  success: boolean;
  move: string;
  game_status: string;
  your_time_remaining_ms: number;
  [key: string]: unknown;
}

export async function makeMove(
  baseUrl: string,
  apiKey: string,
  gameId: string,
  move: string,
  selfReport?: 1 | 2 | 3 | 4,
): Promise<MoveResponse> {
  return request<MoveResponse>(`${baseUrl}/api/v1/games/${gameId}/move`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ move, self_report: selfReport }),
  });
}

export async function resignGame(baseUrl: string, apiKey: string, gameId: string): Promise<GameStateResponse> {
  return request<GameStateResponse>(`${baseUrl}/api/v1/games/${gameId}/resign`, {
    method: "POST",
    headers: authHeaders(apiKey),
  });
}
