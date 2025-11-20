#!/bin/bash
# Systemd service installer for Watcher Agent

SERVICE_NAME="watcher-agent"
SERVICE_USER="nobody"
INSTALL_PATH="/opt/watcher-agent"

echo "Installing $SERVICE_NAME as systemd service..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Create installation directory
mkdir -p $INSTALL_PATH
cp -r dist/* $INSTALL_PATH/
cp .env $INSTALL_PATH/

# Create systemd service file
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Watcher Application Monitoring Agent
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_PATH}
Environment="NODE_ENV=production"
EnvironmentFile=${INSTALL_PATH}/.env
ExecStart=/usr/bin/node ${INSTALL_PATH}/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable ${SERVICE_NAME}

echo "Service installed successfully!"
echo ""
echo "Start the service with: sudo systemctl start ${SERVICE_NAME}"
echo "Check status with: sudo systemctl status ${SERVICE_NAME}"
echo "View logs with: sudo journalctl -u ${SERVICE_NAME} -f"
