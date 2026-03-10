#!/bin/bash

# TinniMate Server Setup Script
# Run this on a fresh server to set up the deployment environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 TinniMate Server Setup${NC}"
echo "================================"

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Variables
DEPLOY_USER=${1:-deploy}
DEPLOY_HOME="/home/$DEPLOY_USER"
PROJECT_DIR="$DEPLOY_HOME/tinnimate"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Deploy user: $DEPLOY_USER"
echo "  Project path: $PROJECT_DIR"
echo ""

# Create deploy user if doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo -e "${YELLOW}👤 Creating deploy user: $DEPLOY_USER${NC}"
    useradd -m -s /bin/bash "$DEPLOY_USER"
    echo -e "${GREEN}✅ User created${NC}"
else
    echo -e "${GREEN}✓ User $DEPLOY_USER exists${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt-get update
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker "$DEPLOY_USER"
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Create project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating project directory...${NC}"
    mkdir -p "$PROJECT_DIR"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_DIR"
    echo -e "${GREEN}✅ Project directory created${NC}"
else
    echo -e "${GREEN}✓ Project directory exists${NC}"
fi

# Clone repository
echo -e "${YELLOW}🔽 Cloning repository...${NC}"
if [ ! -d "$PROJECT_DIR/.git" ]; then
    sudo -u "$DEPLOY_USER" git clone https://github.com/trothinhphucan-creator/Tinnimate.git "$PROJECT_DIR"
    echo -e "${GREEN}✅ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Repository already cloned${NC}"
fi

# Create directories for volumes and logs
echo -e "${YELLOW}📂 Creating required directories...${NC}"
mkdir -p "$PROJECT_DIR/logs/nginx"
mkdir -p "$PROJECT_DIR/ssl"
mkdir -p "$PROJECT_DIR/postgres-data"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_DIR/logs" "$PROJECT_DIR/ssl" "$PROJECT_DIR/postgres-data"
chmod 755 "$PROJECT_DIR/ssl"
echo -e "${GREEN}✅ Directories created${NC}"

# Setup SSL certificates
echo -e "${YELLOW}🔐 Setting up SSL certificates...${NC}"
echo ""
echo "You have two options:"
echo "1. Use Let's Encrypt with Certbot (recommended for production)"
echo "2. Use self-signed certificates (for testing only)"
echo ""
read -p "Choose option (1 or 2): " ssl_choice

if [ "$ssl_choice" = "1" ]; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt-get install -y certbot python3-certbot-nginx

    echo ""
    echo "Run this command to generate Let's Encrypt certificates:"
    echo "  sudo certbot certonly --standalone -d tinimate.vuinghe.com"
    echo ""
    echo "Then copy the certificates:"
    echo "  sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/fullchain.pem $PROJECT_DIR/ssl/cert.pem"
    echo "  sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/privkey.pem $PROJECT_DIR/ssl/key.pem"
    echo "  sudo chown $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR/ssl/*"
    echo ""
    read -p "Press Enter after copying certificates..."
elif [ "$ssl_choice" = "2" ]; then
    echo -e "${YELLOW}Generating self-signed certificate...${NC}"
    openssl req -x509 -newkey rsa:4096 -keyout "$PROJECT_DIR/ssl/key.pem" -out "$PROJECT_DIR/ssl/cert.pem" -days 365 -nodes -subj "/CN=tinimate.vuinghe.com"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_DIR/ssl"/*
    echo -e "${GREEN}✅ Self-signed certificate created${NC}"
    echo -e "${YELLOW}⚠️  WARNING: Self-signed certificates are not suitable for production!${NC}"
else
    echo -e "${RED}Invalid choice. Skipping SSL setup.${NC}"
fi

# Setup environment file
echo -e "${YELLOW}⚙️  Setting up environment configuration...${NC}"
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    cp "$PROJECT_DIR/.env.production.example" "$PROJECT_DIR/.env.production"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_DIR/.env.production"
    chmod 600 "$PROJECT_DIR/.env.production"

    echo ""
    echo -e "${YELLOW}📝 Please edit the environment file:${NC}"
    echo "  nano $PROJECT_DIR/.env.production"
    echo ""
    read -p "Press Enter after editing the environment file..."
else
    echo -e "${GREEN}✓ Environment file already exists${NC}"
fi

# Create systemd service for docker-compose
echo -e "${YELLOW}⚙️  Creating systemd service...${NC}"
cat > /etc/systemd/system/tinnimate.service << EOF
[Unit]
Description=TinniMate Docker Compose Service
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=forking
User=$DEPLOY_USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose up -d
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tinnimate.service
echo -e "${GREEN}✅ Systemd service created${NC}"

# Setup deploy user SSH key
echo -e "${YELLOW}🔑 Setting up SSH access for deployment...${NC}"
mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"
touch "$DEPLOY_HOME/.ssh/authorized_keys"
chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"

echo ""
echo -e "${YELLOW}📋 Next steps for GitHub Actions:${NC}"
echo ""
echo "1. Get deploy SSH key:"
echo "   ssh-keygen -t ed25519 -f github-deploy-key -N ''"
echo ""
echo "2. Add public key to authorized_keys:"
echo "   cat github-deploy-key.pub >> $DEPLOY_HOME/.ssh/authorized_keys"
echo ""
echo "3. Add GitHub Secrets to your repository:"
echo "   DEPLOY_HOST=tinimate.vuinghe.com"
echo "   DEPLOY_USER=$DEPLOY_USER"
echo "   DEPLOY_PORT=22"
echo "   DEPLOY_SSH_KEY=(content of github-deploy-key)"
echo ""

# Show final status
echo ""
echo -e "${GREEN}✨ Server setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Manual steps:${NC}"
echo "1. Edit environment variables: nano $PROJECT_DIR/.env.production"
echo "2. Setup SSL certificates (if not done)"
echo "3. Setup GitHub Secrets (DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_SSH_KEY)"
echo "4. Start services: sudo systemctl start tinnimate"
echo ""
echo -e "${YELLOW}📊 To check service status:${NC}"
echo "   sudo systemctl status tinnimate"
echo "   sudo docker-compose -f $PROJECT_DIR/docker-compose.yml ps"
echo ""
