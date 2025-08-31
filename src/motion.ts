import type { GPIOEventEmitter } from "./gpio.ts";
import type { Notifier } from "./notifier.twilio.ts";
import type { Config } from "./config.ts";

export interface MotionService {
  start(): void;
  stop(): void;
}

export class PIRMotionService implements MotionService {
  private gpio: GPIOEventEmitter;
  private notifier: Notifier;
  private config: Config;
  private clock: () => number;
  
  private lastMotionAt = 0;
  private lastAlertAt = 0;
  private initializedAt: number;
  private isStarted = false;

  constructor(
    gpio: GPIOEventEmitter,
    notifier: Notifier,
    config: Config,
    clock: () => number = () => Date.now()
  ) {
    this.gpio = gpio;
    this.notifier = notifier;
    this.config = config;
    this.clock = clock;
    this.initializedAt = clock();
  }

  start(): void {
    if (this.isStarted) return;
    
    this.isStarted = true;
    this.gpio.on("change", (value: number) => {
      if (value === 1) { // Rising edge
        this.handleMotion();
      }
    });
    
    console.log(JSON.stringify({
      level: "info",
      msg: "Motion service started",
      warmupMs: this.config.WARMUP_MS,
      ts: new Date().toISOString()
    }));
  }

  stop(): void {
    this.isStarted = false;
    this.gpio.close();
  }

  private async handleMotion(): Promise<void> {
    const now = this.clock();
    
    // Warmup period check
    if (now - this.initializedAt < this.config.WARMUP_MS) {
      console.log(JSON.stringify({
        level: "debug",
        msg: "Motion ignored during warmup",
        ts: new Date().toISOString()
      }));
      return;
    }

    // Debounce check
    if (now - this.lastMotionAt < this.config.DEBOUNCE_MS) {
      console.log(JSON.stringify({
        level: "debug",
        msg: "Motion debounced",
        ts: new Date().toISOString()
      }));
      return;
    }

    this.lastMotionAt = now;

    // Schedule check
    if (!this.isInActiveHours(now)) {
      console.log(JSON.stringify({
        level: "info",
        msg: "Motion detected outside active hours",
        ts: new Date().toISOString()
      }));
      return;
    }

    // Cooldown check
    if (now - this.lastAlertAt < this.config.COOLDOWN_MS) {
      console.log(JSON.stringify({
        level: "info",
        msg: "Motion detected during cooldown",
        ts: new Date().toISOString()
      }));
      return;
    }

    // Valid motion - send alert
    await this.sendAlert(now);
  }

  private async sendAlert(timestamp: number): Promise<void> {
    try {
      const message = `🏠 Someone just arrived home! (${new Date(timestamp).toLocaleTimeString()})`;
      await this.notifier.sendArrival(message);
      this.lastAlertAt = timestamp;
      
      console.log(JSON.stringify({
        level: "info",
        msg: "Arrival alert sent",
        ts: new Date().toISOString()
      }));
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        msg: "Failed to send arrival alert",
        error: error instanceof Error ? error.message : String(error),
        ts: new Date().toISOString()
      }));
    }
  }

  private isInActiveHours(timestamp: number): boolean {
    if (!this.config.ACTIVE_FROM || !this.config.ACTIVE_TO) {
      return true; // No schedule configured, always active
    }

    const date = new Date(timestamp);
    const timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                   date.getMinutes().toString().padStart(2, '0');
    
    return timeStr >= this.config.ACTIVE_FROM && timeStr <= this.config.ACTIVE_TO;
  }
}

export function createMotionService(
  gpio: GPIOEventEmitter,
  notifier: Notifier,
  config: Config,
  clock?: () => number
): MotionService {
  return new PIRMotionService(gpio, notifier, config, clock);
}