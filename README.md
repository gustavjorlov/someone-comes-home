# Someone Comes Home

A Raspberry Pi-based motion detection system that sends SMS notifications when someone arrives home.

## Overview

This system uses a PIR (Passive Infrared) sensor to detect motion at your entryway and sends SMS notifications via Twilio. It includes smart filtering to avoid false alarms and optional camera integration for photo capture.

## Features

- **Motion Detection**: PIR sensor with intelligent noise filtering
- **SMS Notifications**: Instant alerts via Twilio
- **Smart Filtering**: Warmup period, debouncing, and cooldown to prevent spam
- **Scheduled Operation**: Optional time-based filtering
- **Camera Integration**: Capture and upload photos to S3 (optional)
- **Health Monitoring**: HTTP endpoint for system status
- **Robust Logging**: Structured logs for debugging and monitoring

## Hardware Requirements

- Raspberry Pi (any model with GPIO)
- PIR Motion Sensor (HC-SR501 recommended)
- Raspberry Pi Camera Module v2 (optional)
- MicroSD card (16GB+ recommended)

## Software Requirements

- Node.js 16+ on Raspberry Pi
- Twilio account for SMS
- AWS account for S3 photo storage (optional)

## Quick Start

### 1. Hardware Setup

Connect the PIR sensor to your Raspberry Pi:
- VCC → 5V (Pin 2)
- GND → Ground (Pin 6)  
- OUT → GPIO 17 (Pin 11)

If using camera:
- Connect Raspberry Pi Camera Module v2 to CSI port
- Enable camera: `sudo raspi-config` → Interface Options → Camera → Enable

### 2. Software Installation

```bash
# Clone and setup
git clone <repository-url>
cd someone-comes-home
npm install
npm run build

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### 3. Configuration

Create `.env` file with your settings:

```bash
# Required - Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
FROM_NUMBER=+1234567890
TO_NUMBER=+0987654321

# Optional - Timing (defaults shown)
GPIO_PIN=17
COOLDOWN_MS=60000
WARMUP_MS=60000
DEBOUNCE_MS=300

# Optional - Schedule
ACTIVE_FROM=06:30
ACTIVE_TO=23:30

# Optional - Camera & S3
CAMERA_ENABLED=true
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
PHOTO_CLEANUP_ENABLED=true
```

### 4. Run

```bash
# Development
npm test
npm run build
node dist/app.js

# Production with PM2
npm install -g pm2
pm2 start dist/app.js --name pir-sms
pm2 save
pm2 startup
```

## Development

### Testing

```bash
npm test                    # Run all tests with coverage
npm run test:watch         # Watch mode during development
```

### Building

```bash
npm run build              # Compile TypeScript to dist/
```

### Project Structure

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

## How It Works

1. **Motion Detection**: PIR sensor detects infrared changes and triggers GPIO pin
2. **Smart Filtering**: System applies warmup, debounce, and cooldown logic
3. **Schedule Check**: Optionally filters by time of day
4. **Notification**: Sends SMS via Twilio API
5. **Photo Capture**: Optionally captures and uploads photo to S3
6. **Logging**: Records all events for monitoring

## Monitoring

- **Health Check**: `GET http://your-pi:3000/health`
- **Logs**: Structured JSON logs to console
- **PM2 Monitoring**: `pm2 monit` for process monitoring

## Troubleshooting

### Common Issues

**No SMS notifications:**
- Check Twilio credentials in `.env`
- Verify phone numbers include country codes
- Check network connectivity

**Motion not detected:**
- Verify PIR sensor wiring
- Check GPIO permissions (may need `sudo` or gpio group)
- Adjust PIR sensor sensitivity potentiometer

**Camera issues:**
- Ensure camera is enabled: `sudo raspi-config`
- Check camera connection to CSI port
- Verify AWS S3 credentials and bucket permissions

### Debugging

Enable detailed logging by checking system logs:

```bash
# View PM2 logs
pm2 logs pir-sms

# View system logs
sudo journalctl -f -u your-service-name
```

## License

ISC

## Contributing

1. Follow TDD approach - write tests first
2. Update README.md when adding features
3. Keep modules focused with clear responsibilities
4. Ensure clear setup/run instructions