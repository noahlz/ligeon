#!/usr/bin/env bash
# Bump to next prepatch dev version after a release tag and commit the result.
# Example: 0.2.6 -> 0.2.7-dev.0
set -euo pipefail

npm version --no-git-tag-version --preid=dev prepatch
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "chore: post-release working version is v${VERSION}"
