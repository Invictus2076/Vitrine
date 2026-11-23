#!/usr/bin/env bash
# Builds the two release repositories (vitrine-plugin and vitrine-theme) from this repository.
# Usage: tools/split-release-repos.sh <output-dir>
# Each folder gets what Obsidian's community lists expect at the repository root.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:?usage: split-release-repos.sh <output-dir>}"
rm -rf "$out/vitrine-plugin" "$out/vitrine-theme"
mkdir -p "$out/vitrine-plugin" "$out/vitrine-theme"

plugin="$here/plugin/vitrine"
for f in LICENSE manifest.json versions.json package.json package-lock.json tsconfig.json tsconfig.test.json esbuild.config.mjs .gitignore; do
  cp "$plugin/$f" "$out/vitrine-plugin/$f"
done
cp -r "$plugin/src" "$out/vitrine-plugin/src"
# That README says where to run the build from in this repository; in the plugin repository it is the root
sed -i 's| (from `plugin/vitrine`)||' "$out/vitrine-plugin/src/README.md"
mkdir "$out/vitrine-plugin/test"
for t in "$plugin"/test/*.test.ts; do
  # The contract test reads the theme from a sibling folder, so it stays in this repository
  [ "$(basename "$t")" = "contract.test.ts" ] || cp "$t" "$out/vitrine-plugin/test/"
done
cp "$here/tools/release/plugin.README.md" "$out/vitrine-plugin/README.md"
cp "$here/tools/release/plugin.DEVELOPING.md" "$out/vitrine-plugin/DEVELOPING.md"

theme="$here/theme/Vitrine"
cp "$theme/LICENSE" "$theme/manifest.json" "$theme/theme.css" "$out/vitrine-theme/"
cp "$here/tools/release/theme.README.md" "$out/vitrine-theme/README.md"
[ -f "$here/tools/release/screenshot.png" ] && cp "$here/tools/release/screenshot.png" "$out/vitrine-theme/screenshot.png"
# Images the theme README shows
[ -d "$here/tools/release/img" ] && cp -r "$here/tools/release/img" "$out/vitrine-theme/img"
echo "wrote $out/vitrine-plugin and $out/vitrine-theme"
