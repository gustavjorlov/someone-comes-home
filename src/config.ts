import { load } from "@std/dotenv";

export interface Config {
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  FROM_NUMBER: string;
  TO_NUMBER: string;

  // GPIO & Timing
  GPIO_PIN: number;
  COOLDOWN_MS: number;
  WARMUP_MS: number;
  DEBOUNCE_MS: number;

  // Schedule (optional)
  ACTIVE_FROM?: string;
  ACTIVE_TO?: string;

  // Camera & S3 (optional)
  CAMERA_ENABLED: boolean;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  S3_BUCKET_NAME?: string;
  PHOTO_CLEANUP_ENABLED: boolean;

  NODE_ENV: string;
}

export async function loadConfig(): Promise<Config> {
  // Load .env file in development
  if (Deno.env.get("NODE_ENV") !== "production") {
    await load({ export: true });
  }

  const config: Config = {
    TWILIO_ACCOUNT_SID: Deno.env.get("TWILIO_ACCOUNT_SID") || "",
    TWILIO_AUTH_TOKEN: Deno.env.get("TWILIO_AUTH_TOKEN") || "",
    FROM_NUMBER: Deno.env.get("FROM_NUMBER") || "",
    TO_NUMBER: Deno.env.get("TO_NUMBER") || "",
    
    GPIO_PIN: parseInt(Deno.env.get("GPIO_PIN") || "17"),
    COOLDOWN_MS: parseInt(Deno.env.get("COOLDOWN_MS") || "60000"),
    WARMUP_MS: parseInt(Deno.env.get("WARMUP_MS") || "60000"),
    DEBOUNCE_MS: parseInt(Deno.env.get("DEBOUNCE_MS") || "300"),
    
    ACTIVE_FROM: Deno.env.get("ACTIVE_FROM"),
    ACTIVE_TO: Deno.env.get("ACTIVE_TO"),
    
    CAMERA_ENABLED: Deno.env.get("CAMERA_ENABLED") !== "false",
    AWS_ACCESS_KEY_ID: Deno.env.get("AWS_ACCESS_KEY_ID"),
    AWS_SECRET_ACCESS_KEY: Deno.env.get("AWS_SECRET_ACCESS_KEY"),
    AWS_REGION: Deno.env.get("AWS_REGION"),
    S3_BUCKET_NAME: Deno.env.get("S3_BUCKET_NAME"),
    PHOTO_CLEANUP_ENABLED: Deno.env.get("PHOTO_CLEANUP_ENABLED") !== "false",
    
    NODE_ENV: Deno.env.get("NODE_ENV") || "development"
  };

  // Validate required fields in production
  if (config.NODE_ENV === "production") {
    const required = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "FROM_NUMBER", "TO_NUMBER"];
    for (const field of required) {
      if (!config[field as keyof Config]) {
        throw new Error(`Missing required environment variable: ${field}`);
      }
    }
  }

  return config;
}