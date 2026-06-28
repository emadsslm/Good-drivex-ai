/**
 * DriveX AI — Live Trip Sharing mini-service
 *
 * A lightweight Bun WebSocket server (no external deps) that lets a driver
 * broadcast their live location/speed to viewers who open a shared link.
 *
 * Port: 3003 (hard-coded as required by the gateway rules).
 *
 * Protocol (native WebSocket, JSON messages):
 *  - Client → Server: { type: "subscribe", code: "ABC123" }
 *  - Client → Server: { type: "broadcast", code: "ABC123", payload: {...} }
 *  - Server → Client: { type: "update", payload: {...} }
 *  - Server → Client: { type: "viewers", count: N }
 *
 * Frontend connects via: new WebSocket(`${proto}://${host}/?XTransformPort=3003`)
 */

const PORT = 3003;

type WSData = { code: string | null; role: "broadcaster" | "viewer" | null };

const server = Bun.serve<WSData>({
  port: PORT,
  websocket: {
    open(ws) {
      ws.data = { code: null, role: null };
    },
    message(ws, message) {
      let msg: any;
      try {
        msg = JSON.parse(message.toString());
      } catch {
        return;
      }

      if (msg.type === "subscribe" && typeof msg.code === "string") {
        const code = msg.code.toUpperCase();
        ws.unsubscribe("all");
        ws.subscribe(`trip:${code}`);
        ws.data.code = code;
        ws.data.role = "viewer";
        // Acknowledge + broadcast current viewer count.
        broadcastViewers(code);
        return;
      }

      if (msg.type === "broadcast" && typeof msg.code === "string" && msg.payload) {
        const code = msg.code.toUpperCase();
        ws.data.code = code;
        ws.data.role = "broadcaster";
        ws.subscribe(`trip:${code}`);
        // Forward update to all subscribers (including broadcaster for echo test).
        server.publish(`trip:${code}`, JSON.stringify({ type: "update", payload: msg.payload }));
        broadcastViewers(code);
        return;
      }

      if (msg.type === "end" && ws.data.code) {
        server.publish(
          `trip:${ws.data.code}`,
          JSON.stringify({ type: "ended" })
        );
      }
    },
    close(ws) {
      if (ws.data.code) {
        // Delay slightly to let other sockets settle, then recount.
        setTimeout(() => broadcastViewers(ws.data.code!), 200);
      }
    },
  },
  fetch(req, server) {
    // Health check + upgrade endpoint.
    if (req.headers.get("upgrade") === "websocket") {
      const ok = server.upgrade(req, { data: { code: null, role: null } as WSData });
      if (ok) return undefined;
    }
    return new Response(
      JSON.stringify({ service: "DriveX Live Trip", port: PORT, status: "ok" }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});

function broadcastViewers(code: string) {
  // Approximate viewer count by checking subscribed sockets.
  // Bun doesn't expose subscriber count directly, so we publish and let clients count.
  // As a simple heuristic, we send a "ping" and rely on the broadcaster to track.
  server.publish(
    `trip:${code}`,
    JSON.stringify({ type: "viewers-ping" })
  );
}

console.log(`DriveX Live Trip service running on port ${PORT}`);

// Keep process alive and report memory usage periodically.
setInterval(() => {
  const mem = process.memoryUsage?.();
  if (mem) {
    console.log(`[live-trip] memory RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
  }
}, 60000);
