#!/bin/bash
set -e

# Someone Comes Home - Installation Script
# This script downloads and installs the latest release

REPO="someone-comes-home"
OWNER="${GITHUB_REPOSITORY_OWNER:-gustavjorlov}"
BINARY_NAME="someone-comes-home"
INSTALL_DIR="/usr/local/bin"
SERVICE_NAME="someone-comes-home"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect architecture
detect_arch() {
    local arch
    arch=$(uname -m)
    case $arch in
        x86_64)
            echo "x64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l)
            echo "arm64"  # Use arm64 binary for armv7l (Raspberry Pi)
            ;;
        *)
            print_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
}

# Detect OS
detect_os() {
    local os
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    case $os in
        linux)
            echo "linux"
            ;;
        darwin)
            echo "macos"
            ;;
        *)
            print_error "Unsupported OS: $os"
            exit 1
            ;;
    esac
}

# Get latest release version
get_latest_version() {
    curl -s "https://api.github.com/repos/$OWNER/$REPO/releases/latest" | \
    grep '"tag_name":' | \
    sed -E 's/.*"([^"]+)".*/\1/'
}

# Download and install binary
install_binary() {
    local version="$1"
    local os="$2"
    local arch="$3"
    local binary_name="${BINARY_NAME}-${os}-${arch}"
    local download_url="https://github.com/$OWNER/$REPO/releases/download/$version/$binary_name"
    
    print_status "Downloading $binary_name..."
    
    # Create temporary directory
    local tmp_dir=$(mktemp -d)
    cd "$tmp_dir"
    
    # Download binary
    if ! curl -L -o "$binary_name" "$download_url"; then
        print_error "Failed to download binary from $download_url"
        exit 1
    fi
    
    # Make executable
    chmod +x "$binary_name"
    
    # Install binary
    print_status "Installing to $INSTALL_DIR/$BINARY_NAME..."
    if [[ $EUID -eq 0 ]]; then
        mv "$binary_name" "$INSTALL_DIR/$BINARY_NAME"
    else
        sudo mv "$binary_name" "$INSTALL_DIR/$BINARY_NAME"
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$tmp_dir"
    
    print_success "Binary installed successfully!"
}

# Create systemd service
create_service() {
    local service_file="/etc/systemd/system/${SERVICE_NAME}.service"
    local working_dir="/opt/$SERVICE_NAME"
    
    print_status "Creating systemd service..."
    
    # Create working directory
    if [[ $EUID -eq 0 ]]; then
        mkdir -p "$working_dir"
    else
        sudo mkdir -p "$working_dir"
    fi
    
    # Create service file
    cat > "/tmp/${SERVICE_NAME}.service" << EOSERVICE
[Unit]
Description=Someone Comes Home - PIR Motion Detection System
After=network.target
Wants=network.target

[Service]
Type=exec
User=pi
Group=gpio
WorkingDirectory=$working_dir
ExecStart=$INSTALL_DIR/$BINARY_NAME
Restart=always
RestartSec=5
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=$working_dir

[Install]
WantedBy=multi-user.target
EOSERVICE
    
    # Install service file
    if [[ $EUID -eq 0 ]]; then
        mv "/tmp/${SERVICE_NAME}.service" "$service_file"
    else
        sudo mv "/tmp/${SERVICE_NAME}.service" "$service_file"
    fi
    
    print_success "Systemd service created!"
}

# Setup configuration
setup_config() {
    local working_dir="/opt/$SERVICE_NAME"
    local env_file="$working_dir/.env"
    
    print_status "Setting up configuration..."
    
    if [[ ! -f "$env_file" ]]; then
        cat > "/tmp/.env.example" << EOENV
# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
FROM_NUMBER=+1234567890
TO_NUMBER=+0987654321

# GPIO & Timing Configuration (Optional - defaults shown)
GPIO_PIN=17
COOLDOWN_MS=60000
WARMUP_MS=60000
DEBOUNCE_MS=300

# Schedule Configuration (Optional - leave empty for 24/7 operation)
# ACTIVE_FROM=06:30
# ACTIVE_TO=23:30

# Camera & S3 Configuration (Optional)
CAMERA_ENABLED=false
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=your-bucket-name
PHOTO_CLEANUP_ENABLED=true

# Environment
NODE_ENV=production
EOENV
        
        if [[ $EUID -eq 0 ]]; then
            mv "/tmp/.env.example" "$env_file"
            chown pi:gpio "$env_file"
            chmod 600 "$env_file"
        else
            sudo mv "/tmp/.env.example" "$env_file"
            sudo chown pi:gpio "$env_file"
            sudo chmod 600 "$env_file"
        fi
        
        print_warning "Configuration file created at $env_file"
        print_warning "Please edit this file with your Twilio credentials before starting the service"
    else
        print_status "Configuration file already exists at $env_file"
    fi
}

# Main installation process
main() {
    print_status "Installing Someone Comes Home..."
    
    # Check if running on supported system
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This installer only supports Linux and macOS"
        exit 1
    fi
    
    # Detect system
    local os=$(detect_os)
    local arch=$(detect_arch)
    
    print_status "Detected system: $os-$arch"
    
    # Get latest version
    local version=$(get_latest_version)
    if [[ -z "$version" ]]; then
        print_error "Failed to get latest release version"
        exit 1
    fi
    
    print_status "Latest version: $version"
    
    # Install binary
    install_binary "$version" "$os" "$arch"
    
    # Setup systemd service (Linux only)
    if [[ "$os" == "linux" ]]; then
        create_service
        setup_config
        
        print_status "Reloading systemd..."
        if [[ $EUID -eq 0 ]]; then
            systemctl daemon-reload
        else
            sudo systemctl daemon-reload
        fi
        
        print_success "Installation complete!"
        echo
        print_status "Next steps:"
        echo "1. Edit configuration: /opt/$SERVICE_NAME/.env"
        echo "2. Start service: sudo systemctl start $SERVICE_NAME"
        echo "3. Enable auto-start: sudo systemctl enable $SERVICE_NAME"
        echo "4. Check status: sudo systemctl status $SERVICE_NAME"
        echo "5. View logs: sudo journalctl -f -u $SERVICE_NAME"
    else
        print_success "Installation complete!"
        echo
        print_status "You can now run: $BINARY_NAME"
        print_warning "Note: Systemd service setup is only available on Linux"
    fi
}

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Someone Comes Home - Installation Script"
    echo
    echo "Usage: curl -sSL <install-url> | bash"
    echo "   or: bash install.sh"
    echo
    echo "This script will:"
    echo "  - Download the latest binary for your system"
    echo "  - Install it to /usr/local/bin"
    echo "  - Set up systemd service (Linux only)"
    echo "  - Create configuration template"
    echo
    echo "Options:"
    echo "  -h, --help    Show this help message"
    exit 0
fi

# Run main installation
main "$@"