#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

async function main() {
  const githubToken =
    process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const configPath = process.env.INPUT_CONFIG_PATH || '.commit-coach.yml';
  const commitHash = process.env.INPUT_COMMIT_HASH;
  const prNumber = process.env.INPUT_PR_NUMBER;
  const comment = process.env.INPUT_COMMENT !== 'false';
  const statusCheck = process.env.INPUT_STATUS_CHECK !== 'false';


  if (!githubToken) {
    console.error('❌ GitHub token is required');
    console.error('Available environment variables:');
    console.error('INPUT_GITHUB_TOKEN:', process.env.INPUT_GITHUB_TOKEN ? '***' : 'undefined');
    console.error('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '***' : 'undefined');
    process.exit(1);
  }

  // Set environment variables for the CLI
  process.env.GITHUB_TOKEN = githubToken;

  try {
    // Check if config file exists
    if (!existsSync(configPath)) {
      console.log(`ℹ️  No config file found at ${configPath}, using defaults`);
    }

    // Build the command
    let command = 'commit-coach github';

    if (commitHash) {
      command += ` --commit ${commitHash}`;
    } else if (prNumber) {
      command += ` --pr ${prNumber}`;
    }

    // Note: The CLI uses --comment and --status-check as boolean flags
    // When they are true (default), we don't need to specify them
    // When they are false, we need to use --no-comment and --no-status-check
    if (!comment) {
      command += ' --no-comment';
    }

    if (!statusCheck) {
      command += ' --no-status-check';
    }

    console.log(`🚀 Running: ${command}`);

    // Execute the command
    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    });

    console.log('✅ Commit Coach analysis completed successfully');
  } catch (error) {
    console.error('❌ Commit Coach analysis failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Action failed:', error);
  process.exit(1);
});
