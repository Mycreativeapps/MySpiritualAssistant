#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  MySpiritualCoach — Deploy / Redeploy Script
#  Run this every time you want to push a new version.
#
#  Usage (from inside the Server/ directory on EC2):
#    chmod +x deploy.sh
#    ./deploy.sh
# ═══════════════════════════════════════════════════════════
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🚀 Deploying MySpiritualCoach Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Pull latest code from git
echo "▶ Pulling latest code..."
git pull origin main

# Stop existing container gracefully
echo "▶ Stopping existing container..."
docker-compose down --timeout 30

# Build new image
echo "▶ Building Docker image..."
docker-compose build --no-cache

# Start container in background
echo "▶ Starting container..."
docker-compose up -d

# Wait for health check
echo "▶ Waiting for server to be healthy..."
sleep 10

# Check status
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Deployment successful!"
    echo "   Server running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
    echo "   API Docs:          http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000/api-docs"
    echo ""
    echo "   Logs: docker-compose logs -f"
else
    echo "❌ Deployment may have failed. Check logs:"
    docker-compose logs --tail=50
    exit 1
fi
