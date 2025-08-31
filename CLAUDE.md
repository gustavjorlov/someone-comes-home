# Someone Comes Home - Raspberry Pi Motion Detection System

## Project Overview
A Raspberry Pi-based system that detects arrivals using a PIR sensor and sends SMS notifications via Twilio, with optional camera integration for photo capture.

## Key Features
- PIR motion detection with noise filtering (warmup, debounce, cooldown)
- SMS notifications via Twilio
- Optional scheduled operation (time-based filtering)
- Camera integration with S3 photo storage
- Health endpoint monitoring
- Structured logging

## Way of working
- As features are added to the project, their intentions and APIs should be documented in README.md.
- Code changes should be accompanied by tests that validate the new behavior.
- Split code files into reasonably big modules with clear responsibilities.
- Make sure the readme has clear instructions on how to run the project.

## Technology Stack
- Deno/TypeScript (compiles to binary)
- PIR Sensor (HC-SR501)
- Raspberry Pi Camera Module v2
- Twilio SMS API (`twilio` npm package)
- GPIO control (custom FFI implementation)
- AWS S3 for photo storage
- Deno HTTP server for health endpoint
- Deno testing framework (minimal terminal output)

## Project Structure
```
src/
  config.ts              # Environment configuration
  gpio.ts               # GPIO interface wrapper
  motion.ts             # Core motion detection logic
  notifier.twilio.ts    # SMS notification service
  camera.ts             # Camera capture functionality
  s3-uploader.ts        # S3 photo upload service
  server.ts             # Health endpoint
  app.ts                # Application wiring
tests/
  *.test.ts            # Test files
```

## Environment Variables
```
# Twilio Configuration
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
FROM_NUMBER=+1...
TO_NUMBER=+46...

# GPIO & Timing
GPIO_PIN=17
COOLDOWN_MS=60000
WARMUP_MS=60000
DEBOUNCE_MS=300

# Schedule (optional)
ACTIVE_FROM=06:30
ACTIVE_TO=23:30

# Camera & S3 (optional)
CAMERA_ENABLED=true
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
PHOTO_CLEANUP_ENABLED=true
```

## Hardware Setup
- Connect PIR sensor to GPIO pin 17
- Connect Raspberry Pi Camera Module v2 to CSI port
- Enable camera: `sudo raspi-config` → Interface Options → Camera → Enable

## Development Commands
- **Test**: `deno task test` (minimal terminal output)
- **Build**: `deno task build` (compiles to binary)
- **Dev**: `deno task dev` (watch mode)
- **Start**: `deno task start`

## Development Environment
- Development: macOS (this machine)
- Production: Raspberry Pi with Deno binary (no runtime dependencies)

## Deployment
- Single binary deployment: `./bin/someone-comes-home`
- Systemd service for autostart
- No runtime dependencies (self-contained binary)

## Testing Strategy
- TDD approach with comprehensive unit tests
- Integration tests with mocked dependencies
- On-device acceptance testing for real-world validation