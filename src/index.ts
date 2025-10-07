#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { GitAnalyzer } from './core/git.js';
import { InsightGenerator } from './insights/generator.js';
import { ConfigLoader } from './config/loader.js';
import {
  ConsoleFormatter,
  CommentFormatter,
  StatusCheckFormatter,
  ReportFormatter,
} from './output/formatters.js';
import { GitHubIntegration } from './integrations/github.js';
import { CoachConfig } from './types/index.js';

const program = new Command();

program
  .name('commit-coach')
  .description(
    'An intelligent commit analysis tool that provides insights and coaching'
  )
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a commit and generate insights')
  .option('-c, --commit <hash>', 'Commit hash to analyze (default: HEAD)')
  .option('-r, --repo <path>', 'Repository path (default: current directory)')
  .option(
    '-o, --output <format>',
    'Output format: console, comment, status-check, report',
    'console'
  )
  .option('--config <path>', 'Path to configuration file')
  .option('--no-color', 'Disable colored output')
  .option('--verbose', 'Enable verbose output')
  .action(async options => {
    try {
      await analyzeCommit(options);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize commit-coach configuration in the current directory')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async options => {
    try {
      await initConfig(options);
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    }
  });

program
  .command('github')
  .description('Analyze commit and post results to GitHub')
  .option('-c, --commit <hash>', 'Commit hash to analyze (default: HEAD)')
  .option('-r, --repo <path>', 'Repository path (default: current directory)')
  .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
  .option('--owner <owner>', 'GitHub repository owner')
  .option('--repo-name <name>', 'GitHub repository name')
  .option(
    '--pr <number>',
    'Pull request number (auto-detected if not provided)'
  )
  .option('--comment', 'Post comment on PR', true)
  .option('--no-comment', 'Disable posting comment on PR')
  .option('--status-check', 'Create status check', true)
  .option('--no-status-check', 'Disable creating status check')
  .action(async options => {
    try {
      await analyzeWithGitHub(options);
    } catch (error) {
      console.error('❌ GitHub analysis failed:', error);
      process.exit(1);
    }
  });

async function analyzeCommit(options: any) {
  const config = loadConfig(options.config, options.repo);
  const gitAnalyzer = new GitAnalyzer(options.repo);

  // Verify we're in a git repository
  if (!(await gitAnalyzer.isRepository())) {
    throw new Error(
      'Not a git repository. Please run from a git repository root.'
    );
  }

  // Get commit info
  const commitHash = options.commit || 'HEAD';
  console.log(`🔍 Analyzing commit: ${commitHash}`);

  const commitInfo = await gitAnalyzer.getCommitInfo(commitHash);

  // Generate insights
  const insightGenerator = new InsightGenerator(config);
  const result = insightGenerator.generateInsights(commitInfo);

  // Format and output results
  const formatter = createFormatter(options.output, config, options);
  const output = formatter.format(result);

  console.log(output);
}

async function analyzeWithGitHub(options: any) {
  const config = loadConfig(undefined, options.repo);
  const gitAnalyzer = new GitAnalyzer(options.repo);

  if (!(await gitAnalyzer.isRepository())) {
    throw new Error(
      'Not a git repository. Please run from a git repository root.'
    );
  }

  const commitHash = options.commit || 'HEAD';
  console.log(`🔍 Analyzing commit for GitHub: ${commitHash}`);

  const commitInfo = await gitAnalyzer.getCommitInfo(commitHash);

  const insightGenerator = new InsightGenerator(config);
  const result = insightGenerator.generateInsights(commitInfo);

  // Setup GitHub integration
  const githubConfig = {
    token: options.token || process.env.GITHUB_TOKEN,
    owner: options.owner || extractGitHubOwner(commitInfo),
    repo: options.repoName || extractGitHubRepo(commitInfo),
    prNumber: options.pr,
    commentOnPR: options.comment,
    createStatusCheck: options.statusCheck,
  };

  if (!githubConfig.token) {
    throw new Error(
      'GitHub token is required. Set GITHUB_TOKEN env var or use --token option.'
    );
  }

  const githubIntegration = new GitHubIntegration(githubConfig);

  // Auto-detect PR number if not provided
  if (options.comment && !githubConfig.prNumber) {
    githubConfig.prNumber = await githubIntegration.getPRNumber(commitHash);
    if (!githubConfig.prNumber) {
      console.log('ℹ️  No associated PR found, skipping comment');
    }
  }

  // Post results to GitHub
  if (options.comment && githubConfig.prNumber) {
    await githubIntegration.postComment(result);
  }

  if (options.statusCheck) {
    await githubIntegration.createStatusCheck(result, commitHash);
  }

  // Also show console output
  const formatter = new ConsoleFormatter(config.output, !options.noColor);
  console.log(formatter.format(result));
}

async function initConfig(options: any) {
  const configPath = '.commit-coach.yml';

  if (existsSync(configPath) && !options.force) {
    console.log(
      '⚠️  Configuration file already exists. Use --force to overwrite.'
    );
    return;
  }

  const sampleConfig = ConfigLoader.createSampleConfig();
  writeFileSync(configPath, sampleConfig);

  console.log('✅ Created commit-coach configuration file: .commit-coach.yml');
  console.log('📝 Edit the file to customize rules and settings.');
}

function loadConfig(configPath?: string, repoPath?: string): CoachConfig {
  if (configPath) {
    return ConfigLoader.loadConfig(configPath);
  }
  return ConfigLoader.loadConfig(repoPath || '.');
}

function createFormatter(format: string, config: CoachConfig, options: any) {
  switch (format) {
    case 'comment':
      return new CommentFormatter(config.output);
    case 'status-check':
      return new StatusCheckFormatter(config.output);
    case 'report':
      return new ReportFormatter(config.output);
    case 'console':
    default:
      return new ConsoleFormatter(config.output, !options.noColor);
  }
}

function extractGitHubOwner(_commitInfo: any): string {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf8',
    }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

function extractGitHubRepo(_commitInfo: any): string {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf8',
    }).trim();
    const match = remoteUrl.match(/github\.com[:/][^/]+\/([^/.]+)/);
    return match ? match[1].replace('.git', '') : 'unknown';
  } catch {
    return 'unknown';
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse();
