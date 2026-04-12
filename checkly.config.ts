import { defineConfig } from 'checkly';
import { EmailAlertChannel, Frequency } from 'checkly/constructs';

/**
 * Checkly configuration for SealMath.
 * This setup monitors the critical user flows using Playwright.
 */

const emailAlert = new EmailAlertChannel('default-email-alert', {
  address: 'sealmathcom@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
});

export default defineConfig({
  projectName: 'SealMath Monitoring',
  logicalId: 'seal-math-monitoring',
  repoUrl: 'https://codeberg.org/sealmath/sealmath',
  checks: {
    // Point to the EXISTING Playwright config
    playwrightConfigPath: './playwright.config.ts',
    // Monitoring locations
    locations: ['eu-west-1', 'us-east-1'],
    // Alerting declared in code
    alertChannels: [emailAlert],

    playwrightChecks: [
      {
        name: 'Critical Happy Path',
        logicalId: 'critical-happy-path',
        pwProjects: ['checkly'],
        frequency: Frequency.EVERY_24H, // User requested deployment-only testing, keeping background checks quiet
      },
    ],
  },
  cli: {
    runLocation: 'eu-west-1',
    retries: 0,
  },
});
