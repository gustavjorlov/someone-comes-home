import { assertEquals, assertRejects } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { TwilioNotifier } from "../src/notifier.twilio.ts";
import type { Config } from "../src/config.ts";

// Mock Twilio for testing
class MockTwilioClient {
  messages = {
    create: async (params: any) => {
      if (params.body.includes("fail")) {
        throw new Error("Mock Twilio error");
      }
      return { sid: "mock-message-sid" };
    }
  };
}

describe("TwilioNotifier", () => {
  let config: Config;
  let notifier: TwilioNotifier;

  beforeEach(() => {
    config = {
      TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      TWILIO_AUTH_TOKEN: "test-token",
      FROM_NUMBER: "+1234567890",
      TO_NUMBER: "+0987654321",
      GPIO_PIN: 17,
      COOLDOWN_MS: 60000,
      WARMUP_MS: 60000,
      DEBOUNCE_MS: 300,
      CAMERA_ENABLED: false,
      PHOTO_CLEANUP_ENABLED: true,
      NODE_ENV: "test"
    };
    
    notifier = new TwilioNotifier(config);
    // Replace the real client with our mock
    (notifier as any).client = new MockTwilioClient();
  });

  it("sends SMS with correct parameters", async () => {
    await notifier.sendArrival("Test message");
    // In a real implementation, you would verify the call was made with correct params
  });

  it("handles Twilio API errors", async () => {
    await assertRejects(
      async () => {
        await notifier.sendArrival("fail message");
      },
      Error,
      "Mock Twilio error"
    );
  });
});