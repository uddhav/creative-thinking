#!/usr/bin/env bash
# Deploy the creative-thinking MCP server to Google Cloud Run, with sessions
# and plans in a Neon Postgres database. Built for Google Cloud Shell.
#
# Usage, from the root of a clone of this repository:
#
#   ./scripts/deploy/cloud-run-neon.sh <gcp-project-id>
#
# It asks for the Neon connection string without echoing it, or reads
# DATABASE_URL from the environment. Optional settings, by environment:
#   REGION   Cloud Run region (default us-east1)
#   SERVICE  Cloud Run service name (default creative-thinking)
#
# Run it again to update the service: every step checks before it changes
# anything, and the secret MCP path is generated once and then kept, so the
# connector URL stays the same across deploys.
#
# What it sets up:
#   - The Cloud Run, Cloud Build, Artifact Registry and Secret Manager APIs.
#   - Two secrets: the database URL, and a random MCP path. The path is the
#     only thing between the internet and the tools, so treat the printed
#     connector URL like a password.
#   - A Cloud Run service: scales to zero, at most one instance, public
#     invoke (the secret path is the auth), built from this directory.
#   - A cleanup policy that keeps the two newest images, so old builds do not
#     pile up past the free storage tier.

set -euo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-}}"
REGION="${REGION:-us-east1}"
SERVICE="${SERVICE:-creative-thinking}"
DB_SECRET="${SERVICE}-database-url"
PATH_SECRET="${SERVICE}-mcp-path"
REPOSITORY="cloud-run-source-deploy" # the repository source deploys create

die() {
  echo "error: $*" >&2
  exit 1
}
step() { echo "==> $*"; }
gc() { gcloud --project "$PROJECT_ID" --quiet "$@"; }

[ -n "$PROJECT_ID" ] || die "pass your Google Cloud project id: $0 <project-id>"
[ -f Dockerfile ] && [ -f scripts/docker/entrypoint.mjs ] ||
  die "run this from the root of the creative-thinking repository"
command -v gcloud >/dev/null || die "gcloud is not installed (Cloud Shell has it)"
command -v curl >/dev/null || die "curl is not installed"

if [ -z "${DATABASE_URL:-}" ]; then
  read -r -s -p "Neon connection string (input hidden): " DATABASE_URL
  echo
fi
case "$DATABASE_URL" in
  postgres://* | postgresql://*) ;;
  *) die "the connection string should start with postgresql://" ;;
esac

step "Enabling APIs (a minute the first time)"
gc services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

PROJECT_NUMBER="$(gc projects describe "$PROJECT_ID" --format='value(projectNumber)')"
# New projects build source deploys with the Compute Engine default service
# account, and Cloud Run runs the service as it too unless told otherwise.
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

step "Letting the build account build Cloud Run images"
gc projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" --role=roles/run.builder \
  --condition=None >/dev/null

# put_secret NAME VALUE: create the secret if missing, add a version only when
# the value changed (each active version counts toward the free tier of six),
# and let the service account read it.
put_secret() {
  local name="$1" value="$2" current
  if ! gc secrets describe "$name" >/dev/null 2>&1; then
    gc secrets create "$name" --replication-policy=automatic >/dev/null
  fi
  current="$(gc secrets versions access latest --secret="$name" 2>/dev/null || true)"
  if [ "$current" != "$value" ]; then
    printf '%s' "$value" | gc secrets versions add "$name" --data-file=- >/dev/null
  fi
  gc secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/secretmanager.secretAccessor >/dev/null
}

step "Storing the database URL and the MCP path in Secret Manager"
put_secret "$DB_SECRET" "$DATABASE_URL"
MCP_PATH="$(gc secrets versions access latest --secret="$PATH_SECRET" 2>/dev/null || true)"
if [ -z "$MCP_PATH" ]; then
  # 128 random bits: long enough that guessing the path is not an attack.
  MCP_PATH="/mcp-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')"
fi
put_secret "$PATH_SECRET" "$MCP_PATH"

step "Building and deploying to Cloud Run in ${REGION} (a few minutes)"
# The image sets the rest: HTTP transport on $PORT, auto-save of sessions.
gc run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --min-instances 0 \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars PERSISTENCE_TYPE=postgres \
  --set-secrets "DATABASE_URL=${DB_SECRET}:latest,MCP_HTTP_PATH=${PATH_SECRET}:latest"

# --no-dry-run: a repository can be in dry-run mode, where policies only log.
step "Keeping only the two newest images (old ones go within about a day)"
POLICY_FILE="$(mktemp)"
trap 'rm -f "$POLICY_FILE"' EXIT
cat >"$POLICY_FILE" <<'JSON'
[
  {"name": "keep-two-newest", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 2}},
  {"name": "delete-the-rest", "action": {"type": "Delete"}, "condition": {"tagState": "any"}}
]
JSON
gc artifacts repositories set-cleanup-policies "$REPOSITORY" \
  --location="$REGION" --policy="$POLICY_FILE" --no-dry-run >/dev/null

URL="$(gc run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"

step "Checking the service and its database connection"
state=""
for _ in $(seq 1 12); do
  health="$(curl -fsS "${URL}/health" 2>/dev/null || true)"
  state="$(printf '%s' "$health" | sed -n 's/.*"state":"\([a-z]*\)".*/\1/p')"
  [ "$state" = "ready" ] && break
  sleep 5
done

echo
if [ "$state" = "ready" ]; then
  echo "Deployed, and connected to the database."
else
  echo "Deployed, but the database is not connected (persistence: ${state:-no answer})."
  echo "Sessions will live in memory only. Check the connection string, then read the logs:"
  echo "  gcloud run services logs read ${SERVICE} --project ${PROJECT_ID} --region ${REGION}"
fi
cat <<EOF

Connector URL (keep it secret, it is the only key):

  ${URL}${MCP_PATH}

Add it in Claude: Settings > Connectors > Add custom connector, and paste the URL.

Cost: this fits the free tiers, but a public URL can be called by anyone who
finds it. Set a budget alert so a surprise shows up early:
  https://console.cloud.google.com/billing/budgets
EOF

# A deploy that cannot reach its database is not done: fail so it is noticed.
[ "$state" = "ready" ]
