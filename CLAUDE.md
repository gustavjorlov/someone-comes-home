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

## Technology Stack
- Node.js/TypeScript
- PIR Sensor (HC-SR501)
- Raspberry Pi Camera Module v2
- Twilio SMS API (`twilio` npm package)
- GPIO control (`onoff` npm package)
- AWS S3 for photo storage
- Express.js for health endpoint
- Vitest for testing (minimal terminal output)

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
- **Test**: `npm test` (minimal terminal output)
- **Build**: `npm run build`

## Development Environment
- Development: macOS (this machine)
- Production: Raspberry Pi with Node.js

## Deployment
- Uses PM2 for process management: `pm2 start dist/app.js --name pir-sms`
- Autostart: `pm2 save && pm2 startup`

## Testing Strategy
- TDD approach with comprehensive unit tests
- Integration tests with mocked dependencies
- On-device acceptance testing for real-world validation