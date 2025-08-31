import { loadConfig } from "./config.ts";
import { createGPIO } from "./gpio.ts";
import { createNotifier } from "./notifier.twilio.ts";
import { createMotionService } from "./motion.ts";
import { createHealthServer } from "./server.ts";

async function main() {
  console.log(JSON.stringify({
    level: "info",
    msg: "Starting PIR Motion Detection System",
    ts: new Date().toISOString()
  }));

  try {
    // Load configuration
    const config = await loadConfig();
    
    // Initialize components
    const gpio = createGPIO(config.GPIO_PIN);
    const notifier = createNotifier(config);
    const motionService = createMotionService(gpio, notifier, config);
    const healthServer = createHealthServer();

    // Setup graceful shutdown
    const shutdown = () => {
      console.log(JSON.stringify({
        level: "info",
        msg: "Shutting down gracefully",
        ts: new Date().toISOString()
      }));
      
      motionService.stop();
      healthServer.stop();
      Deno.exit(0);
    };

    // Handle shutdown signals
    Deno.addSignalListener("SIGINT", shutdown);
    Deno.addSignalListener("SIGTERM", shutdown);

    // Start services
    motionService.start();
    
    // Start health server (non-blocking)
    healthServer.start(3000).catch(error => {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(JSON.stringify({
          level: "error",
          msg: "Health server failed to start",
          error: error instanceof Error ? error.message : String(error),
          ts: new Date().toISOString()
        }));
      }
    });

    console.log(JSON.stringify({
      level: "info",
      msg: "PIR Motion Detection System started successfully",
      gpio_pin: config.GPIO_PIN,
      cooldown_ms: config.COOLDOWN_MS,
      warmup_ms: config.WARMUP_MS,
      ts: new Date().toISOString()
    }));

    // Keep the main thread alive
    await new Promise(() => {}); // This will run forever until shutdown
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      msg: "Failed to start application",
      error: error instanceof Error ? error.message : String(error),
      ts: new Date().toISOString()
    }));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}