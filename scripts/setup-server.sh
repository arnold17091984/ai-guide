#!/bin/bash
# ============================================================
# サーバー初期セットアップスクリプト
# 使い方: ssh root@YOUR_SERVER_IP < scripts/setup-server.sh
# ============================================================
set -e

echo "=== 1. Docker インストール ==="
if command -v docker &> /dev/null; then
  echo "Docker は既にインストール済み"
else
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker インストール完了"
fi

echo ""
echo "=== 2. ファイアウォール設定 ==="
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  echo "y" | ufw enable 2>/dev/null || true
  echo "UFW 設定完了"
fi

echo ""
echo "=== 3. パスワード認証を無効化（SSH鍵登録後に実行推奨） ==="
echo "  ※ 先に ssh-copy-id で公開鍵を登録してから以下を実行:"
echo "  sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config"
echo "  systemctl restart sshd"

echo ""
echo "=== セットアップ完了 ==="
echo "Docker version: $(docker --version)"
echo ""
echo "次のステップ:"
echo "  1. ローカルで: ssh-keygen -t ed25519 -f ~/.ssh/ai-guide-deploy"
echo "  2. ローカルで: ssh-copy-id -i ~/.ssh/ai-guide-deploy.pub root@$(hostname -I | awk '{print $1}')"
echo "  3. GitHub Secrets に SSH_PRIVATE_KEY を登録"
echo "  4. git push で自動デプロイ開始"
