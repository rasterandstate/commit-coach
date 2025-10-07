#!/usr/bin/env node

/**
 * Release script for Commit Coach
 * Handles semantic versioning and release preparation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const releaseType = args[0]; // major, minor, patch, prerelease

if (
  !releaseType ||
  !['major', 'minor', 'patch', 'prerelease'].includes(releaseType)
) {
  console.error(
    'Usage: node scripts/release.js <major|minor|patch|prerelease>'
  );
  process.exit(1);
}

try {
  // Read current version
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`Current version: ${currentVersion}`);

  // Update version in package.json
  execSync(`npm version ${releaseType} --no-git-tag-version`, {
    stdio: 'inherit',
  });

  // Read new version
  const updatedPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const newVersion = updatedPackageJson.version;

  console.log(`New version: ${newVersion}`);

  // Create git tag
  const tagName = `v${newVersion}`;
  execSync(`git add package.json`);
  execSync(`git commit -m "chore: bump version to ${newVersion}"`);
  execSync(`git tag ${tagName}`);

  console.log(`✅ Version ${newVersion} tagged as ${tagName}`);
  console.log(`📦 Ready for release! Push with: git push origin main --tags`);
} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}
