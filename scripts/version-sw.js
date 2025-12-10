#!/usr/bin/env node
/**
 * Generates a versioned service worker by replacing the cache version
 * with a timestamp-based version. Run this after `next build`.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const version = `v${Date.now()}`;
const swPath = join(process.cwd(), 'out', 'sw.js');

try {
  let content = readFileSync(swPath, 'utf-8');

  // Replace cache names with versioned ones
  content = content.replace(
    /const CACHE_NAME = ['"]radioamador\.info-v\d+['"]/,
    `const CACHE_NAME = 'radioamador.info-${version}'`
  );
  content = content.replace(
    /const DATA_CACHE_NAME = ['"]radioamador\.info-data-v\d+['"]/,
    `const DATA_CACHE_NAME = 'radioamador.info-data-${version}'`
  );

  writeFileSync(swPath, content);
  console.log(`[version-sw] Updated service worker cache version to ${version}`);
} catch (error) {
  console.error('[version-sw] Error updating service worker:', error.message);
  process.exit(1);
}
