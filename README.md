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

- No runtime dependencies on Raspberry Pi (self-contained binary)
- Twilio account for SMS
- AWS account for S3 photo storage (optional)

**For Development Only:**
- Deno 2.0+ for building from source
- No other dependencies required

## Quick Start

### 1. Hardware Setup

Connect the PIR sensor to your Raspberry Pi:
- VCC → 5V (Pin 2)
- GND → Ground (Pin 6)  
- OUT → GPIO 17 (Pin 11)

If using camera:
- Connect Raspberry Pi Camera Module v2 to CSI port
- Enable camera: `sudo raspi-config` → Interface Options → Camera → Enable

### 2. Easy Installation (Recommended)

**One-line install on Raspberry Pi:**

```bash
curl -sSL https://github.com/gustavjorlov/someone-comes-home/releases/latest/download/install.sh | bash
```

This will:
- Auto-detect your system (Linux ARM64 for Raspberry Pi)
- Download the latest binary
- Install to `/usr/local/bin`
- Create systemd service
- Set up configuration template

**Manual Installation:**

```bash
# Download binary for your platform
wget https://github.com/gustavjorlov/someone-comes-home/releases/latest/download/someone-comes-home-linux-arm64

# Make executable and install
chmod +x someone-comes-home-linux-arm64
sudo mv someone-comes-home-linux-arm64 /usr/local/bin/someone-comes-home
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

### 4. Running the Application

**If you used the install script:**

```bash
# 1. Edit configuration
sudo nano /opt/someone-comes-home/.env

# 2. Start the service
sudo systemctl start someone-comes-home
sudo systemctl enable someone-comes-home

# 3. Check status
sudo systemctl status someone-comes-home

# 4. View logs
sudo journalctl -f -u someone-comes-home
```

**Manual run:**

```bash
# Create config file
cp .env.example .env
# Edit .env with your settings

# Run directly
./someone-comes-home
# or if installed globally:
someone-comes-home
```

## Development

**Note**: Development requires Deno 2.0+. The compiled binary runs on Raspberry Pi with no runtime dependencies.

### Testing

```bash
deno task test             # Run all tests with coverage
```

### Building for Production

```bash
deno task build            # Compile to self-contained binary
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/gustavjorlov/someone-comes-home.git
cd someone-comes-home

# Run tests
deno task test

# Build binary
deno task build

# The binary will be at ./bin/someone-comes-home
```

The build process compiles all TypeScript source files and dependencies into a single self-contained binary that can run on any compatible system without installing Deno or any other runtime.

## Releases

Pre-built binaries are automatically created for each release:

- **Linux ARM64** (`someone-comes-home-linux-arm64`) - For Raspberry Pi 4, Pi 5, and other ARM64 systems
- **Linux x64** (`someone-comes-home-linux-x64`) - For standard Linux servers
- **macOS ARM64** (`someone-comes-home-macos-arm64`) - For Apple Silicon Macs
- **macOS x64** (`someone-comes-home-macos-x64`) - For Intel Macs

Each release includes:
- Pre-compiled binaries for all platforms
- SHA256 checksums for verification
- Installation script for easy setup
- Release notes with changes

### Automatic Updates

The install script will always fetch the latest release. To update an existing installation:

```bash
# Re-run the install script
curl -sSL https://github.com/gustavjorlov/someone-comes-home/releases/latest/download/install.sh | bash

# Or manually download and replace the binary
sudo systemctl stop someone-comes-home
sudo wget -O /usr/local/bin/someone-comes-home https://github.com/gustavjorlov/someone-comes-home/releases/latest/download/someone-comes-home-linux-arm64
sudo chmod +x /usr/local/bin/someone-comes-home
sudo systemctl start someone-comes-home
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
- **System Monitoring**: `sudo systemctl status someone-comes-home` for process monitoring
- **Real-time Logs**: `sudo journalctl -f -u someone-comes-home`

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