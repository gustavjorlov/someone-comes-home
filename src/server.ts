// Using Deno's built-in HTTP server instead of @std/http
// The serve function is built into Deno.serve

export interface HealthServer {
  start(port: number): Promise<void>;
  stop(): void;
}

export class ExpressHealthServer implements HealthServer {
  private abortController?: AbortController;

  async start(port: number): Promise<void> {
    this.abortController = new AbortController();
    
    const handler = (req: Request): Response => {
      const url = new URL(req.url);
      
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response("Not Found", { status: 404 });
    };

    console.log(JSON.stringify({
      level: "info",
      msg: `Health server starting on port ${port}`,
      ts: new Date().toISOString()
    }));

    try {
      await Deno.serve({
        port,
        signal: this.abortController.signal,
        onListen: () => {
          console.log(JSON.stringify({
            level: "info",
            msg: `Health server listening on port ${port}`,
            ts: new Date().toISOString()
          }));
        },
      }, handler);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(JSON.stringify({
          level: "error",
          msg: "Health server error",
          error: error.message,
          ts: new Date().toISOString()
        }));
      }
    }
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log(JSON.stringify({
        level: "info",
        msg: "Health server stopped",
        ts: new Date().toISOString()
      }));
    }
  }
}

export function createHealthServer(): HealthServer {
  return new ExpressHealthServer();
}