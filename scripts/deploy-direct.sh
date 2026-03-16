#!/bin/bash
# ============================================================
# ワンショットデプロイスクリプト
# ローカルでビルド → サーバーに転送 → 起動
#
# 使い方:
#   export SERVER=root@152.42.189.157
#   bash scripts/deploy-direct.sh
# ============================================================
set -e

SERVER="${SERVER:?SERVER を設定してください (例: export SERVER=root@YOUR_IP)}"
IMAGE_NAME="ai-guide"
CONTAINER_NAME="ai-guide"

# .env.local から環境変数を読み込む
if [ ! -f .env.local ]; then
  echo "エラー: .env.local が見つかりません"
  exit 1
fi

source <(grep -v '^#' .env.local | grep '=' | sed 's/^/export /')

echo "=== 1/4 Docker イメージをビルド中... ==="
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
  -t ${IMAGE_NAME}:latest .

echo "=== 2/4 イメージを圧縮中... ==="
docker save ${IMAGE_NAME}:latest | gzip > /tmp/${IMAGE_NAME}.tar.gz
echo "  サイズ: $(du -h /tmp/${IMAGE_NAME}.tar.gz | cut -f1)"

echo "=== 3/4 サーバーに転送中... ==="
# サーバーに Docker がなければインストール
ssh ${SERVER} "command -v docker || (curl -fsSL https://get.docker.com | sh)"
scp /tmp/${IMAGE_NAME}.tar.gz ${SERVER}:/tmp/
rm -f /tmp/${IMAGE_NAME}.tar.gz

echo "=== 4/4 サーバーでデプロイ中... ==="
ssh ${SERVER} bash -s <<REMOTE
set -e
docker load < /tmp/${IMAGE_NAME}.tar.gz
rm -f /tmp/${IMAGE_NAME}.tar.gz
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -e NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
  ${IMAGE_NAME}:latest
docker image prune -f
REMOTE

echo ""
echo "=== デプロイ完了！ ==="
echo "http://$(echo ${SERVER} | cut -d@ -f2):3000 でアクセス可能"
