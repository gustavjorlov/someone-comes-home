import twilio from "twilio";
import type { Config } from "./config.ts";

export interface Notifier {
  sendArrival(message: string): Promise<void>;
}

export class TwilioNotifier implements Notifier {
  private client: ReturnType<typeof twilio>;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  }

  async sendArrival(message: string): Promise<void> {
    try {
      await this.client.messages.create({
        body: message,
        from: this.config.FROM_NUMBER,
        to: this.config.TO_NUMBER,
      });
      console.log(JSON.stringify({ 
        level: "info", 
        msg: "SMS sent successfully", 
        ts: new Date().toISOString() 
      }));
    } catch (error) {
      console.error(JSON.stringify({ 
        level: "error", 
        msg: "Failed to send SMS", 
        error: error instanceof Error ? error.message : String(error),
        ts: new Date().toISOString() 
      }));
      throw error;
    }
  }
}

export function createNotifier(config: Config): Notifier {
  return new TwilioNotifier(config);
}