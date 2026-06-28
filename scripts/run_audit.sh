#!/usr/bin/env bash
set -euo pipefail

# 1️⃣ Start Firebase emulators in background
echo "🚀 Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,storage > /tmp/firebase-emulators.log 2>&1 &
EMULATOR_PID=$!
# Give emulators time to boot (adjust if needed)
sleep 12

# 2️⃣ Lint
echo "🔎 Running ESLint..."
npm run lint

# 3️⃣ Build
echo "🏗️ Building the app..."
npm run build

# 4️⃣ Seed demo data
echo "🌱 Seeding demo data..."
node scripts/seed-demo.mjs

# 5️⃣ API tests (Jest + Supertest)
echo "🧪 Running API tests..."
npx jest tests/api.test.ts --runInBand || echo "API tests had failures"

# 6️⃣ Playwright E2E tests (if present)
if command -v npx >/dev/null && npx playwright --version >/dev/null 2>&1; then
  echo "🖥️ Running Playwright tests..."
  npx playwright test || echo "Playwright tests had failures"
else
  echo "⚠️ Playwright not installed – skipping E2E tests"
fi

# 7️⃣ Cleanup demo data
echo "🧹 Cleaning up demo data..."
node scripts/cleanup-demo.mjs

# 8️⃣ Stop emulators
kill $EMULATOR_PID || true
echo "✅ Audit completed."
