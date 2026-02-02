#!/bin/bash

# -------------------------
# Ellenőrizzük a JWT_SECRET-et
# -------------------------
if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set!"
    echo "Set it with: export JWT_SECRET='abc'"
    exit 1
fi

echo "✅ JWT_SECRET is set."

# Map JWT_SECRET to the config key the API reads (JwtSettings:Secret).
# If it's shorter than 32 chars, derive a 32-byte key via SHA-256 so any length works.
if [ -z "$JwtSettings__Secret" ]; then
    if [ ${#JWT_SECRET} -lt 32 ]; then
        JwtSettings__Secret="$(python3 - <<'PY'
import hashlib, os
print(hashlib.sha256(os.environ["JWT_SECRET"].encode("utf-8")).hexdigest())
PY
)"
        export JwtSettings__Secret
        echo "ℹ️  JwtSettings__Secret derived from short JWT_SECRET (SHA-256)."
    else
        export JwtSettings__Secret="$JWT_SECRET"
        echo "ℹ️  JwtSettings__Secret exported from JWT_SECRET."
    fi
fi

# Ensure issuer/audience are set so JWT validation passes.
if [ -z "$JwtSettings__Issuer" ]; then
    export JwtSettings__Issuer="MagicDraw"
    echo "ℹ️  JwtSettings__Issuer defaulted to MagicDraw."
fi
if [ -z "$JwtSettings__Audience" ]; then
    export JwtSettings__Audience="MagicDraw"
    echo "ℹ️  JwtSettings__Audience defaulted to MagicDraw."
fi

# -------------------------
# Leállítjuk az előző példányokat
# -------------------------
echo "Stopping previous instances..."

# Only stop this app's dotnet host; avoid killing unrelated dotnet/node (e.g., VS Code server).
pkill -f "MagicDraw.AppHost" 2>/dev/null

# -------------------------
# MagicDraw.AppHost mappa
# -------------------------
APP_DIR="src/MagicDraw.AppHost"
if [ ! -d "$APP_DIR" ]; then
    echo "❌ ERROR: Directory $APP_DIR does not exist!"
    exit 1
fi

cd "$APP_DIR" || exit 1

# -------------------------
# Futtatás
# -------------------------
echo "Starting Magic Draw..."
dotnet run

# -------------------------
# Opció a végén várakozásra (fejlesztéshez)
# -------------------------
read -p "Press Enter to exit..."
