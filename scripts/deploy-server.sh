#!/bin/bash

set -e

# Required env vars
if [ -z "${LOCAL_BUILD_DIR_BASE}" ]; then
    echo "Error: LOCAL_BUILD_DIR_BASE is not set." >&2
    exit 1
fi

if [ -z "${DEPLOYMENT_SSH_KEY_PATH}" ]; then
    echo "Error: DEPLOYMENT_SSH_KEY_PATH is not set." >&2
    exit 1
fi

if [ -z "${APEX_HOST}" ]; then
    echo "Error: APEX_HOST is not set." >&2
    exit 1
fi

# Config
echo "using ssh key: ${DEPLOYMENT_SSH_KEY_PATH}"
LOCAL_BUILD_DIR="${LOCAL_BUILD_DIR_BASE}/server"
echo "deploying web-client build from local path: ${LOCAL_BUILD_DIR}"
DEV_ENV="staging"
echo "to environment: ${DEV_ENV}"
# REMOTE_USER="appuser"
REMOTE_USER="root"
REMOTE_HOST="backend.${DEV_ENV}.${APEX_HOST}"
REMOTE_TARGET_DIR="/apps"

# Currently we use ephemeral droplets with dynamic public IPs.
ssh-keygen -f ~/.ssh/known_hosts -R "${REMOTE_HOST}"

SSH_CONNECTION_STRING="${REMOTE_USER}@${REMOTE_HOST}"

ssh -i "${DEPLOYMENT_SSH_KEY_PATH}" -o StrictHostKeyChecking=accept-new "${SSH_CONNECTION_STRING}" "mkdir ${REMOTE_TARGET_DIR}"

rsync -avze "ssh -i ${DEPLOYMENT_SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new" \
   "${LOCAL_BUILD_DIR}/" "${SSH_CONNECTION_STRING}:${REMOTE_TARGET_DIR}/"

rsync -avze "ssh -i ${DEPLOYMENT_SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new" \
   "${LOCAL_BUILD_DIR_BASE}/env/" "${SSH_CONNECTION_STRING}:${REMOTE_TARGET_DIR}/dist"

rsync -avze "ssh -i ${DEPLOYMENT_SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new" \
   ./start-server.sh "${SSH_CONNECTION_STRING}:${REMOTE_TARGET_DIR}/"

# ssh -i "${DEPLOYMENT_SSH_KEY_PATH}" -o StrictHostKeyChecking=accept-new "${SSH_CONNECTION_STRING}" "cd ${REMOTE_TARGET_DIR}/dist && NODE_ENV=staging && /root/.nvm/nvm.sh bash start-backend.sh"