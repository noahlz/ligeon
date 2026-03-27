#!/usr/bin/env bash
# Bump to next patch version after a release tag and commit the result.
set -euo pipefail

npm version --no-git-tag-version patch
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "chore: post-release working version is v${VERSION}"
