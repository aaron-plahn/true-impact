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
echo "ssh key path: ${DEPLOYMENT_SSH_KEY_PATH}"
LOCAL_BUILD_DIR="${LOCAL_BUILD_DIR_BASE}/web-client"
echo "build path: ${LOCAL_BUILD_DIR}"
DEV_ENV="staging"
REMOTE_USER="root"
REMOTE_HOST="client.${DEV_ENV}.${APEX_HOST}"
# TODO Customize this?
REMOTE_TARGET_DIR="/var/www/html/"

# Currently we use ephemeral droplets with dynamic public IPs.
ssh-keygen -f ~/.ssh/known_hosts -R "${REMOTE_HOST}"

rsync -avze "ssh -i ${DEPLOYMENT_SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new" \
   "${LOCAL_BUILD_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TARGET_DIR}/"