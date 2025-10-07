#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

export interface ActionInputs {
  githubToken: string;
  configPath: string;
  commitHash?: string;
  prNumber?: string;
  comment: boolean;
  statusCheck: boolean;
}

export function parseInputs(): ActionInputs {
  const githubToken =
    process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const configPath = process.env.INPUT_CONFIG_PATH || '.commit-coach.yml';
  const commitHash = process.env.INPUT_COMMIT_HASH;
  const prNumber = process.env.INPUT_PR_NUMBER;
  const comment = process.env.INPUT_COMMENT !== 'false';
  // Handle both possible environment variable names for status-check
  const statusCheck =
    (process.env.INPUT_STATUS_CHECK || process.env['INPUT_STATUS-CHECK']) !==
    'false';

  return {
    githubToken: githubToken || '',
    configPath,
    commitHash,
    prNumber,
    comment,
    statusCheck,
  };
}

export function validateInputs(inputs: ActionInputs): void {
  if (!inputs.githubToken) {
    console.error('❌ GitHub token is required');
    console.error('Available environment variables:');
    console.error(
      'INPUT_GITHUB_TOKEN:',
      process.env.INPUT_GITHUB_TOKEN ? '***' : 'undefined'
    );
    console.error(
      'GITHUB_TOKEN:',
      process.env.GITHUB_TOKEN ? '***' : 'undefined'
    );
    process.exit(1);
  }
}

export function buildCommand(inputs: ActionInputs): string {
  let command = 'commit-coach github';

  if (inputs.commitHash) {
    command += ` --commit-hash ${inputs.commitHash}`;
  } else if (inputs.prNumber) {
    command += ` --pr-number ${inputs.prNumber}`;
  }

  // Note: The CLI uses --comment and --status-check as boolean flags
  // When they are true (default), we don't need to specify them
  // When they are false, we need to use --no-comment and --no-status-check
  if (!inputs.comment) {
    command += ' --no-comment';
  }

  if (!inputs.statusCheck) {
    command += ' --no-status-check';
  }

  return command;
}

export function executeCommand(command: string, githubToken: string): void {
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
}

export async function runAction(): Promise<void> {
  const inputs = parseInputs();
  validateInputs(inputs);

  // Set environment variables for the CLI
  process.env.GITHUB_TOKEN = inputs.githubToken;

  try {
    // Check if config file exists
    if (!existsSync(inputs.configPath)) {
      console.log(
        `ℹ️  No config file found at ${inputs.configPath}, using defaults`
      );
    }

    const command = buildCommand(inputs);
    executeCommand(command, inputs.githubToken);
  } catch (error) {
    console.error('❌ Commit Coach analysis failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  runAction().catch(error => {
    console.error('❌ Action failed:', error);
    process.exit(1);
  });
}
