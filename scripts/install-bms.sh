#!/usr/bin/env bash
set -euo pipefail

APP_NAME="bookdarr-media-server"
APP_USER="bms"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="https://github.com/thashiznit2003/Bookdarr-Media-Server.git"
BRANCH="main"
ENV_FILE="${APP_DIR}/.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
NODE_SETUP_URL="https://deb.nodesource.com/setup_20.x"

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run this script with sudo or as root."
  exit 1
fi

apt-get update
apt-get install -y curl ca-certificates git build-essential python3 make g++ libsqlite3-dev

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "${NODE_SETUP_URL}" | bash -
  apt-get install -y nodejs
fi

if ! id "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --home "${APP_DIR}" --shell /usr/sbin/nologin "${APP_USER}"
fi

mkdir -p "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  sudo -u "${APP_USER}" git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch origin
  sudo -u "${APP_USER}" git -C "${APP_DIR}" checkout "${BRANCH}"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --ff-only
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cat <<'ENV' > "${ENV_FILE}"
PORT=9797
DB_TYPE=sqlite
DB_PATH=/opt/bookdarr-media-server/data/bms.sqlite
DB_SYNC=false
# Run TypeORM migrations at startup when DB_SYNC is false.
DB_MIGRATIONS=true
BOOKDARR_API_URL=
BOOKDARR_API_KEY=
BOOKDARR_BOOKPOOL_PATH=/api/v1/user/library/pool
OPENLIBRARY_BASE_URL=https://openlibrary.org
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
DIAGNOSTICS_REQUIRED=true
DIAGNOSTICS_REPO=thashiznit2003/Bookdarr-Media-Diagnostics
DIAGNOSTICS_BRANCH=main
DIAGNOSTICS_PATH=bms
DIAGNOSTICS_TOKEN=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
RESET_TOKEN_TTL_MINUTES=30
INVITE_CODES=
ENV
  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
fi

# Ensure the DB + cache directories are owned by the service user to avoid SQLITE_READONLY.
mkdir -p "${APP_DIR}/data" "${APP_DIR}/data/offline" "${APP_DIR}/data/backups"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/data"
if [[ -f "${APP_DIR}/data/bms.sqlite" ]]; then
  chown "${APP_USER}:${APP_USER}" "${APP_DIR}/data/bms.sqlite"
  chmod 600 "${APP_DIR}/data/bms.sqlite"
fi

sudo -u "${APP_USER}" bash -lc "cd ${APP_DIR} && npm ci"
sudo -u "${APP_USER}" bash -lc "cd ${APP_DIR} && npm run build"

cat <<SERVICE > "${SERVICE_FILE}"
[Unit]
Description=Bookdarr Media Server
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node ${APP_DIR}/dist/main.js
Restart=on-failure
RestartSec=2
TimeoutStartSec=30
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable "${APP_NAME}"
systemctl restart "${APP_NAME}"

echo "${APP_NAME} installed."
echo "Edit ${ENV_FILE} and run: systemctl restart ${APP_NAME}"
