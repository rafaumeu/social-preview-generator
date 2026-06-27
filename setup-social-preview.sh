#!/usr/bin/env bash
# setup-social-preview.sh — Copy social preview workflow + config to any repo
# Usage: ./setup-social-preview.sh <repo-path> [title] [subtitle] [emoji] [accent-color] [tags-comma-separated]
# Example: ./setup-social-preview.sh ./my-project "My Project" "A cool app" "🚀" "#E74C3C" "nextjs,typescript"

set -euo pipefail

REPO_PATH="${1:?Usage: $0 <repo-path> [title] [subtitle] [emoji] [accent] [tags]}"
TITLE="${2:-$(basename "$(cd "$REPO_PATH" && pwd)")}"
SUBTITLE="${3:-}"
EMOJI="${4:-⚡}"
ACCENT="${5:-#6C5CE7}"
TAGS_RAW="${6:-}"

WORKFLOW_SRC="$(cd "$(dirname "$0")" && pwd)/.github/workflows/generate-social-preview.yml"

if [ ! -f "$WORKFLOW_SRC" ]; then
  echo "ERROR: $WORKFLOW_SRC not found"
  exit 1
fi

if [ ! -d "$REPO_PATH/.github" ]; then
  mkdir -p "$REPO_PATH/.github/workflows"
fi

# Copy workflow
cp "$WORKFLOW_SRC" "$REPO_PATH/.github/workflows/generate-social-preview.yml"
echo "Copied workflow to $REPO_PATH/.github/workflows/generate-social-preview.yml"

# Build config
CONFIG="{\n  \"title\": \"$TITLE\",\n  \"subtitle\": \"$SUBTITLE\",\n  \"accent\": \"$ACCENT\",\n  \"darkMode\": true,\n  \"emoji\": \"$EMOJI\""

if [ -n "$TAGS_RAW" ]; then
  CONFIG+=",\n  \"tags\": ["
  IFS=',' read -ra TAG_ARRAY <<< "$TAGS_RAW"
  for i in "${!TAG_ARRAY[@]}"; do
    tag="${TAG_ARRAY[$i]}"
    [ "$i" -gt 0 ] && CONFIG+=", "
    CONFIG+="\"$tag\""
  done
  CONFIG+="]"
else
  CONFIG+=",\n  \"tags\": []"
fi

CONFIG+="\n}"
echo -e "$CONFIG" > "$REPO_PATH/.github/social-preview.config.json"
echo "Created $REPO_PATH/.github/social-preview.config.json"

echo ""
echo "Done! Next steps:"
echo "  cd $REPO_PATH"
echo "  git add .github/"
echo "  git commit -m 'ci: add automated social preview generation'"
echo "  git push"
