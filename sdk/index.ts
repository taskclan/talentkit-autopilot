/**
 * Kin Autopilot — thin client for TalentKit engine extension APIs.
 * Clean-room TypeScript; no ApplyPilot / AGPL code.
 */

export type AutopilotClientOptions = {
  /** Engine naijacv base, e.g. https://engine.taskclan.com/api/naijacv */
  baseUrl: string;
  /** Extension token from TalentKit Settings → Extension */
  token: string;
  fetch?: typeof fetch;
};

export type QueueItem = {
  application_id: string;
  status: string;
  job: {
    id: string;
    url: string;
    title: string | null;
    company: string | null;
    source: string;
    location: string | null;
  } | null;
  template: string;
  executor?: string;
  route_reason?: string | null;
  updated_at: string;
  resume_url?: string;
};

export type QueueResponse = {
  may_submit: boolean;
  apply_email?: string;
  auto_mode?: boolean;
  extension_alive?: boolean;
  items: QueueItem[];
};

export type ReportStatus = "applying" | "submitted" | "needs_user" | "extension_queued";

export type AutopilotClient = {
  getQueue: () => Promise<QueueResponse>;
  getFillData: () => Promise<unknown>;
  reportQueue: (args: {
    applicationId: string;
    status: ReportStatus | string;
    note?: string;
  }) => Promise<unknown>;
  match: (payload: Record<string, unknown>) => Promise<unknown>;
  answer: (payload: Record<string, unknown>) => Promise<unknown>;
};

function join(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createAutopilotClient(opts: AutopilotClientOptions): AutopilotClient {
  const fetchFn = opts.fetch ?? globalThis.fetch;
  if (!fetchFn) throw new Error("fetch is not available; pass opts.fetch");

  async function request(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetchFn(join(opts.baseUrl, path), {
      ...init,
      headers: {
        Authorization: `Bearer ${opts.token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        json && typeof json === "object" && "error" in json
          ? String((json as { error: unknown }).error)
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  }

  return {
    getQueue: () => request("/agent/extension/queue") as Promise<QueueResponse>,
    getFillData: () => request("/agent/extension/fill-data"),
    reportQueue: (args) =>
      request("/agent/extension/queue", {
        method: "POST",
        body: JSON.stringify({
          applicationId: args.applicationId,
          status: args.status,
          note: args.note || "",
        }),
      }),
    match: (payload) =>
      request("/agent/extension/match", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    answer: (payload) =>
      request("/agent/extension/answer", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}
