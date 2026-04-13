const { execSync } = require('child_process');

/**
 * Migration script that handles environment detection for Vercel.
 * Targets the Production DB for production deploys and the Test DB for everything else.
 */

const VERCEL_ENV = process.env.VERCEL_ENV || 'development';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

// Project IDs
const PROD_PROJECT = 'aklaifdmrdloycebatrd';
const TEST_PROJECT = 'wqfjagbkkmgwomjpawat';

const targetProject = VERCEL_ENV === 'production' ? PROD_PROJECT : TEST_PROJECT;

console.log(`[Migrate] Detected environment: ${VERCEL_ENV}`);
console.log(`[Migrate] Target project: ${targetProject}`);

if (!DB_PASSWORD) {
  if (VERCEL_ENV === 'production' || VERCEL_ENV === 'preview') {
    console.error('[Migrate] Error: SUPABASE_DB_PASSWORD is not set in a deployment environment. Failing build.');
    process.exit(1);
  } else {
    console.warn('[Migrate] Warning: SUPABASE_DB_PASSWORD is not set. Skipping migration for local build.');
    process.exit(0);
  }
}

try {
  // 1. Link to the correct project
  console.log(`[Migrate] Linking to project ${targetProject}...`);
  execSync(`npx supabase link --project-ref ${targetProject} --password "${DB_PASSWORD}"`, { stdio: 'inherit' });

  // 2. Push migrations
  console.log('[Migrate] Pushing migrations...');
  execSync(`npx supabase db push --password "${DB_PASSWORD}" --yes`, { stdio: 'inherit' });

  console.log('[Migrate] Migration completed successfully.');
} catch (error) {
  console.error('[Migrate] Error during migration:', error.message);
  process.exit(1);
}
