type WsEvent =
  | { type: "run_started"; run_id: string }
  | { type: "step_update"; run_id?: string; step?: string; steps_completed?: string[] }
  | {
      type: "completed";
      run_id?: string;
      final_post?: string;
      char_count?: number;
      hashtags?: string[];
      steps_completed?: string[];
    }
  | { type: "error"; message?: string };

interface ConnectParams {
  topic?: string;
  mode: "topic" | "trending";
}

const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /^http/,
  "ws"
);

export function connectGenerateWs(
  params: ConnectParams,
  onEvent: (event: WsEvent) => void,
  onClose: () => void
): () => void {
  const ws = new WebSocket(`${WS_URL}/api/ws/generate`);

  ws.onopen = () => {
    ws.send(JSON.stringify(params));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as WsEvent;
      onEvent(data);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    onClose();
  };

  return () => {
    ws.close();
  };
}
