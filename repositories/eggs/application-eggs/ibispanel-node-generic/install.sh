#!/bin/sh
set -eu

cd /mnt/server
export HOME=/mnt/server
export npm_config_cache=/mnt/server/.npm-cache

repo=${GIT_ADDRESS:-}
branch=${GIT_BRANCH:-}
mode=${NPM_INSTALL_MODE:-auto}

case "$mode" in
    auto|ci|install|skip) ;;
    *) echo 'Invalid npm install mode.' >&2; exit 2 ;;
esac

if [ -n "$repo" ]; then
    case "$repo" in
        *'..'*|*[!A-Za-z0-9_./:-]*) echo 'Use a public GitHub HTTPS repository URL without credentials.' >&2; exit 2 ;;
    esac
    if ! printf '%s' "$repo" | grep -Eq '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(\.git)?$'; then
        echo 'Use a public GitHub HTTPS repository URL without credentials.' >&2
        exit 2
    fi
    if [ -n "$(ls -A .)" ]; then
        echo 'Server files already exist; refusing to overwrite them during Git import.' >&2
        exit 2
    fi
    if ! command -v git >/dev/null 2>&1; then
        apt-get update -qq
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends git ca-certificates
    fi
    if [ -n "$branch" ]; then
        case "$branch" in
            -*|*'..'*|*[!A-Za-z0-9_./-]*) echo 'Invalid Git branch.' >&2; exit 2 ;;
        esac
        git check-ref-format --branch "$branch" >/dev/null 2>&1 || { echo 'Invalid Git branch.' >&2; exit 2; }
        GIT_TERMINAL_PROMPT=0 git clone --quiet --depth 1 --single-branch --branch "$branch" "$repo" .
    else
        GIT_TERMINAL_PROMPT=0 git clone --quiet --depth 1 "$repo" .
    fi
elif [ -n "$branch" ]; then
    echo 'A Git branch requires a repository URL.' >&2
    exit 2
fi

if [ "$mode" != skip ] && [ -f package.json ]; then
    if [ "$mode" = ci ] || { [ "$mode" = auto ] && [ -f package-lock.json ]; }; then
        if [ ! -f package-lock.json ]; then
            echo 'npm ci requires package-lock.json.' >&2
            exit 2
        fi
        npm ci --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi
fi

echo 'IbisPanel Node.js installation complete'
