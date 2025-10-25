#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to .env.public file
const envPublicPath = path.join(__dirname, '../.env.public');

function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const env = {};

  lines.forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return { content, env };
}

function writeEnvFile(filePath, content, key, newValue) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newContent = content.replace(regex, `${key}=${newValue}`);
  fs.writeFileSync(filePath, newContent);
}

function bumpVersion(version) {
  const parts = version.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);

  // Increment patch version
  return `${major}.${minor}.${patch + 1}`;
}

try {
  console.log('Bumping version...');

  // Read current version from .env.public
  const { content: publicContent, env: publicEnv } = readEnvFile(envPublicPath);
  const oldVersion = publicEnv.VITE_PUBLIC_APP_VERSION;

  if (!oldVersion) {
    throw new Error('VITE_PUBLIC_APP_VERSION not found in .env.public');
  }

  // Calculate new version
  const newVersion = bumpVersion(oldVersion);

  // Update .env.public
  writeEnvFile(envPublicPath, publicContent, 'VITE_PUBLIC_APP_VERSION', newVersion);

  console.log(`Version: ${oldVersion} -> ${newVersion}`);
  console.log('Version bumped successfully!');
} catch (error) {
  console.error('Error bumping version:', error);
  process.exit(1);
}
