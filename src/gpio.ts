// GPIO adapter for Raspberry Pi using FFI to access GPIO
// Note: This is a simplified implementation for Deno
// In production, you might want to use a more robust GPIO library

export interface GPIOEventEmitter {
  on(event: "change", callback: (value: number) => void): void;
  close(): void;
}

export class DenoGPIO implements GPIOEventEmitter {
  private pin: number;
  private callbacks: ((value: number) => void)[] = [];
  private interval?: number;
  private lastValue = 0;

  constructor(pin: number) {
    this.pin = pin;
    this.startPolling();
  }

  on(event: "change", callback: (value: number) => void): void {
    if (event === "change") {
      this.callbacks.push(callback);
    }
  }

  private startPolling(): void {
    // This is a placeholder implementation
    // In a real implementation, you would use FFI to access GPIO
    // For now, we'll simulate GPIO changes for testing
    this.interval = setInterval(() => {
      // Simulate random GPIO changes for development
      if (Math.random() < 0.1) {
        const newValue = this.lastValue === 0 ? 1 : 0;
        if (newValue !== this.lastValue) {
          this.lastValue = newValue;
          this.callbacks.forEach(callback => callback(newValue));
        }
      }
    }, 100);
  }

  close(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

export function createGPIO(pin: number): GPIOEventEmitter {
  return new DenoGPIO(pin);
}