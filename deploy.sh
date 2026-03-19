#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== MeshCore Map — Deploy ==="

# Install Node.js if not present
if ! command -v node &>/dev/null; then
  echo "[1/5] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "[1/5] Node.js $(node -v) already installed, skipping."
fi

# Install pm2 if not present
if ! command -v pm2 &>/dev/null; then
  echo "[2/5] Installing pm2..."
  sudo npm install -g pm2
else
  echo "[2/5] pm2 already installed, skipping."
fi

# Install backend dependencies
echo "[3/5] Installing backend dependencies..."
cd "$REPO_DIR/backend"
npm install

# Start or restart backend with pm2
if pm2 describe meshcore-backend &>/dev/null; then
  echo "  Restarting backend..."
  pm2 restart meshcore-backend
else
  echo "  Starting backend..."
  pm2 start src/server.js --name meshcore-backend
fi

# Install frontend dependencies and build
echo "[4/5] Building frontend..."
cd "$REPO_DIR/frontend"
npm install
npm run build

# Serve frontend with pm2
if pm2 describe meshcore-frontend &>/dev/null; then
  echo "  Restarting frontend..."
  pm2 restart meshcore-frontend
else
  echo "  Starting frontend..."
  pm2 serve build 3000 --name meshcore-frontend --spa
fi

# Save pm2 process list and enable startup
echo "[5/5] Configuring pm2 to start on boot..."
pm2 save
pm2 startup | grep "sudo" | bash || true

echo ""
echo "=== Deploy complete! ==="
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "Checking sync logs (Ctrl+C to exit)..."
sleep 2
pm2 logs meshcore-backend --lines 20 --nostream
