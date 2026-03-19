#!/bin/bash
set -e

echo "=== MeshCore Map — GitHub Setup ==="

# Install gh if not present
if ! command -v gh &>/dev/null; then
  echo "[1/4] Installing GitHub CLI..."
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update -q && sudo apt install -y gh
else
  echo "[1/4] GitHub CLI already installed, skipping."
fi

# Authenticate if not already
if ! gh auth status &>/dev/null; then
  echo "[2/4] Logging into GitHub (a browser window will open)..."
  gh auth login --hostname github.com --git-protocol https --web
else
  echo "[2/4] Already authenticated with GitHub, skipping."
fi

# Init git repo and make initial commit if needed
cd "$(dirname "$0")"

# Get git identity from GitHub if not already configured
if [ -z "$(git config --global user.email)" ]; then
  GH_EMAIL=$(gh api user/emails --jq '[.[] | select(.primary==true)] | .[0].email' 2>/dev/null || echo "")
  GH_NAME=$(gh api user --jq '.name // .login' 2>/dev/null || echo "")
  if [ -n "$GH_EMAIL" ]; then
    git config --global user.email "$GH_EMAIL"
    echo "  Set git email: $GH_EMAIL"
  fi
  if [ -n "$GH_NAME" ]; then
    git config --global user.name "$GH_NAME"
    echo "  Set git name:  $GH_NAME"
  fi
fi

echo "[3/4] Setting up git repository..."
[ ! -d ".git" ] && git init
git add .
if git diff --cached --quiet; then
  echo "  Nothing to commit, working tree clean."
else
  git commit -m "Initial commit — MeshCore Bay Area map"
fi

# Create GitHub repo and push
echo "[4/4] Creating GitHub repo and pushing..."
gh repo create meshcore-map --public --source=. --remote=origin --push

echo ""
echo "=== Done! ==="
gh repo view --web
