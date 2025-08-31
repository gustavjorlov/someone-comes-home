import { assertEquals } from "@std/assert";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { PIRMotionService } from "../src/motion.ts";
import type { GPIOEventEmitter } from "../src/gpio.ts";
import type { Notifier } from "../src/notifier.twilio.ts";
import type { Config } from "../src/config.ts";

// Mock GPIO
class MockGPIO implements GPIOEventEmitter {
  private callbacks: ((value: number) => void)[] = [];

  on(event: "change", callback: (value: number) => void): void {
    if (event === "change") {
      this.callbacks.push(callback);
    }
  }

  close(): void {
    this.callbacks = [];
  }

  triggerChange(value: number): void {
    this.callbacks.forEach(cb => cb(value));
  }
}

// Mock Notifier
class MockNotifier implements Notifier {
  public sentMessages: string[] = [];

  async sendArrival(message: string): Promise<void> {
    this.sentMessages.push(message);
  }
}

describe("PIRMotionService", () => {
  let mockGPIO: MockGPIO;
  let mockNotifier: MockNotifier;
  let config: Config;
  let motionService: PIRMotionService;
  let mockTime: number;
  let clock: () => number;

  beforeEach(() => {
    mockGPIO = new MockGPIO();
    mockNotifier = new MockNotifier();
    mockTime = Date.now();
    clock = () => mockTime;
    
    config = {
      TWILIO_ACCOUNT_SID: "test-sid",
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
    
    motionService = new PIRMotionService(mockGPIO, mockNotifier, config, clock);
  });

  it("ignores motion during warmup period", async () => {
    motionService.start();
    
    // Trigger motion immediately (should be ignored due to warmup)
    mockGPIO.triggerChange(1);
    
    // Wait a bit for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    assertEquals(mockNotifier.sentMessages.length, 0);
  });

  it("sends notification after warmup period", async () => {
    motionService.start();
    
    // Advance time past warmup period
    mockTime += config.WARMUP_MS + 1000;
    
    // Trigger motion
    mockGPIO.triggerChange(1);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    assertEquals(mockNotifier.sentMessages.length, 1);
  });

  it("respects cooldown period", async () => {
    motionService.start();
    
    // Advance past warmup
    mockTime += config.WARMUP_MS + 1000;
    
    // First motion
    mockGPIO.triggerChange(1);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Second motion within cooldown (should be ignored)
    mockTime += config.COOLDOWN_MS / 2;
    mockGPIO.triggerChange(1);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    assertEquals(mockNotifier.sentMessages.length, 1);
  });
});