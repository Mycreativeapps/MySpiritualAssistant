#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  MySpiritualCoach — EC2 One-Time Setup Script
#  Run this ONCE after launching a fresh Amazon Linux 2023
#  or Ubuntu 22.04 EC2 instance.
#
#  Usage:
#    chmod +x ec2-setup.sh
#    sudo ./ec2-setup.sh
# ═══════════════════════════════════════════════════════════
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " MySpiritualCoach — EC2 Setup Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Detect OS ────────────────────────────────
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. Exiting."
    exit 1
fi

echo "Detected OS: $OS"

# ── 1. Install Docker ────────────────────────
echo ""
echo "▶ Installing Docker..."

if [ "$OS" = "amzn" ]; then
    # Amazon Linux 2023
    dnf update -y
    dnf install -y docker git
elif [ "$OS" = "ubuntu" ]; then
    # Ubuntu 22.04
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# ── 2. Start & Enable Docker ─────────────────
echo "▶ Enabling Docker service..."
systemctl enable docker
systemctl start docker

# Add current user to docker group (so you don't need sudo)
usermod -aG docker ec2-user 2>/dev/null || usermod -aG docker ubuntu 2>/dev/null || true

# ── 3. Install Docker Compose (standalone) ───
echo "▶ Installing Docker Compose..."
COMPOSE_VERSION="v2.27.0"
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo ""
echo "✅ Docker version: $(docker --version)"
echo "✅ Docker Compose version: $(docker-compose --version)"

# ── 4. Open Firewall Ports (ufw for Ubuntu) ──
if [ "$OS" = "ubuntu" ]; then
    echo "▶ Configuring UFW firewall..."
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw allow 3000/tcp # App port
    ufw --force enable
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Setup complete! Next steps:"
echo ""
echo " 1. Upload your code to EC2:"
echo "    git clone <your-repo-url> /home/ec2-user/app"
echo "    cd /home/ec2-user/app/Server"
echo ""
echo " 2. Create .env.production from example:"
echo "    cp .env.production.example .env.production"
echo "    nano .env.production  (fill in your values)"
echo ""
echo " 3. Build & Run:"
echo "    docker-compose up -d --build"
echo ""
echo " 4. Check logs:"
echo "    docker-compose logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
