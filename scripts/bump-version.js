#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json files
const rootPackagePath = path.join(__dirname, '../package.json');
const webPackagePath = path.join(__dirname, '../apps/web/package.json');

function readJson(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
}

function bumpVersion(version) {
  const parts = version.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);
  
  // Increment patch version
  return `${major}.${minor}.${patch + 1}`;
}

function updatePackageJson(filePath) {
  const packageJson = readJson(filePath);
  const oldVersion = packageJson.version;
  const newVersion = bumpVersion(oldVersion);
  
  packageJson.version = newVersion;
  writeJson(filePath, packageJson);
  
  return { oldVersion, newVersion };
}

function updateProfileTsx(newVersion) {
  const profilePath = path.join(__dirname, '../apps/web/src/pages/Profile.tsx');
  let content = fs.readFileSync(profilePath, 'utf8');
  
  // Replace the APP_VERSION constant
  content = content.replace(
    /const APP_VERSION = ['"]([^'"]+)['"];/,
    `const APP_VERSION = '${newVersion}';`
  );
  
  fs.writeFileSync(profilePath, content);
}

try {
  console.log('Bumping version...');
  
  // Update root package.json
  const rootResult = updatePackageJson(rootPackagePath);
  console.log(`Root: ${rootResult.oldVersion} -> ${rootResult.newVersion}`);
  
  // Update web package.json
  const webResult = updatePackageJson(webPackagePath);
  console.log(`Web: ${webResult.oldVersion} -> ${webResult.newVersion}`);
  
  // Update Profile.tsx
  updateProfileTsx(webResult.newVersion);
  console.log(`Profile.tsx: Updated to ${webResult.newVersion}`);
  
  console.log('Version bumped successfully!');
} catch (error) {
  console.error('Error bumping version:', error);
  process.exit(1);
}

