import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import {
  parseInputs,
  validateInputs,
  buildCommand,
  executeCommand,
  runAction,
  ActionInputs,
} from './action';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs');

const mockExecSync = vi.mocked(execSync);
const mockExistsSync = vi.mocked(existsSync);

describe('action', () => {
  const originalEnv = process.env;
  const originalExit = process.exit;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };

    // Mock process.exit to prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });

    // Mock console methods to capture output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('parseInputs', () => {
    it('should parse all inputs correctly', () => {
      process.env.INPUT_GITHUB_TOKEN = 'test-token';
      process.env.INPUT_CONFIG_PATH = 'custom-config.yml';
      process.env.INPUT_COMMIT_HASH = 'abc123';
      process.env.INPUT_PR_NUMBER = '42';
      process.env.INPUT_COMMENT = 'true';
      process.env.INPUT_STATUS_CHECK = 'true';

      const result = parseInputs();

      expect(result).toEqual({
        githubToken: 'test-token',
        configPath: 'custom-config.yml',
        commitHash: 'abc123',
        prNumber: '42',
        comment: true,
        statusCheck: true,
      });
    });

    it('should use GITHUB_TOKEN as fallback', () => {
      process.env.GITHUB_TOKEN = 'fallback-token';
      process.env.INPUT_COMMENT = 'false';
      process.env.INPUT_STATUS_CHECK = 'false';

      const result = parseInputs();

      expect(result.githubToken).toBe('fallback-token');
      expect(result.comment).toBe(false);
      expect(result.statusCheck).toBe(false);
    });

    it('should handle status-check with hyphen', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env['INPUT_STATUS-CHECK'] = 'false';

      const result = parseInputs();

      expect(result.statusCheck).toBe(false);
    });

    it('should use default values', () => {
      const result = parseInputs();

      expect(result.githubToken).toBe('');
      expect(result.configPath).toBe('.commit-coach.yml');
      expect(result.commitHash).toBeUndefined();
      expect(result.prNumber).toBeUndefined();
      expect(result.comment).toBe(true);
      expect(result.statusCheck).toBe(true);
    });

    it('should handle comment and status-check as false strings', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_COMMENT = 'false';
      process.env.INPUT_STATUS_CHECK = 'false';

      const result = parseInputs();

      expect(result.comment).toBe(false);
      expect(result.statusCheck).toBe(false);
    });

    it('should handle comment and status-check as true strings', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_COMMENT = 'true';
      process.env.INPUT_STATUS_CHECK = 'true';

      const result = parseInputs();

      expect(result.comment).toBe(true);
      expect(result.statusCheck).toBe(true);
    });
  });

  describe('validateInputs', () => {
    it('should pass validation with valid token', () => {
      const inputs: ActionInputs = {
        githubToken: 'valid-token',
        configPath: '.commit-coach.yml',
        comment: true,
        statusCheck: true,
      };

      expect(() => validateInputs(inputs)).not.toThrow();
    });

    it('should fail validation without token', () => {
      const inputs: ActionInputs = {
        githubToken: '',
        configPath: '.commit-coach.yml',
        comment: true,
        statusCheck: true,
      };

      expect(() => validateInputs(inputs)).toThrow('process.exit(1)');
      expect(console.error).toHaveBeenCalledWith('❌ GitHub token is required');
    });

    it('should log environment variables when token is missing', () => {
      process.env.INPUT_GITHUB_TOKEN = 'test-token';
      process.env.GITHUB_TOKEN = 'fallback-token';

      const inputs: ActionInputs = {
        githubToken: '',
        configPath: '.commit-coach.yml',
        comment: true,
        statusCheck: true,
      };

      expect(() => validateInputs(inputs)).toThrow('process.exit(1)');
      expect(console.error).toHaveBeenCalledWith(
        'Available environment variables:'
      );
      expect(console.error).toHaveBeenCalledWith('INPUT_GITHUB_TOKEN:', '***');
      expect(console.error).toHaveBeenCalledWith('GITHUB_TOKEN:', '***');
    });
  });

  describe('buildCommand', () => {
    it('should build basic command', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        comment: true,
        statusCheck: true,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github');
    });

    it('should include commit hash', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        commitHash: 'abc123',
        comment: true,
        statusCheck: true,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --commit-hash abc123');
    });

    it('should include PR number', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        prNumber: '42',
        comment: true,
        statusCheck: true,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --pr-number 42');
    });

    it('should prioritize commit hash over PR number', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        commitHash: 'abc123',
        prNumber: '42',
        comment: true,
        statusCheck: true,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --commit-hash abc123');
    });

    it('should include no-comment flag when comment is false', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        comment: false,
        statusCheck: true,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --no-comment');
    });

    it('should include no-status-check flag when statusCheck is false', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        comment: true,
        statusCheck: false,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --no-status-check');
    });

    it('should include both no flags when both are false', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        comment: false,
        statusCheck: false,
      };

      const result = buildCommand(inputs);

      expect(result).toBe('commit-coach github --no-comment --no-status-check');
    });

    it('should build complex command with all options', () => {
      const inputs: ActionInputs = {
        githubToken: 'test-token',
        configPath: '.commit-coach.yml',
        commitHash: 'abc123',
        comment: false,
        statusCheck: false,
      };

      const result = buildCommand(inputs);

      expect(result).toBe(
        'commit-coach github --commit-hash abc123 --no-comment --no-status-check'
      );
    });
  });

  describe('executeCommand', () => {
    it('should execute command successfully', () => {
      mockExecSync.mockImplementation(() => Buffer.from(''));

      executeCommand('commit-coach github', 'test-token');

      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github'
      );
      expect(mockExecSync).toHaveBeenCalledWith('commit-coach github', {
        stdio: 'inherit',
        env: {
          ...process.env,
          GITHUB_TOKEN: 'test-token',
        },
      });
      expect(console.log).toHaveBeenCalledWith(
        '✅ Commit Coach analysis completed successfully'
      );
    });

    it('should pass environment variables correctly', () => {
      mockExecSync.mockImplementation(() => Buffer.from(''));

      executeCommand('commit-coach github --pr-number 42', 'test-token');

      expect(mockExecSync).toHaveBeenCalledWith(
        'commit-coach github --pr-number 42',
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            GITHUB_TOKEN: 'test-token',
          },
        }
      );
    });
  });

  describe('runAction', () => {
    it('should run action successfully with existing config', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(mockExistsSync).toHaveBeenCalledWith('.commit-coach.yml');
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('No config file found')
      );
      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github'
      );
      expect(console.log).toHaveBeenCalledWith(
        '✅ Commit Coach analysis completed successfully'
      );
    });

    it('should run action successfully without config file', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExistsSync.mockReturnValue(false);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(mockExistsSync).toHaveBeenCalledWith('.commit-coach.yml');
      expect(console.log).toHaveBeenCalledWith(
        'ℹ️  No config file found at .commit-coach.yml, using defaults'
      );
      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github'
      );
      expect(console.log).toHaveBeenCalledWith(
        '✅ Commit Coach analysis completed successfully'
      );
    });

    it('should run action with custom config path', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_CONFIG_PATH = 'custom-config.yml';
      mockExistsSync.mockReturnValue(false);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(mockExistsSync).toHaveBeenCalledWith('custom-config.yml');
      expect(console.log).toHaveBeenCalledWith(
        'ℹ️  No config file found at custom-config.yml, using defaults'
      );
    });

    it('should run action with commit hash', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_COMMIT_HASH = 'abc123';
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github --commit-hash abc123'
      );
    });

    it('should run action with PR number', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_PR_NUMBER = '42';
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github --pr-number 42'
      );
    });

    it('should run action with disabled comment and status check', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.INPUT_COMMENT = 'false';
      process.env.INPUT_STATUS_CHECK = 'false';
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(console.log).toHaveBeenCalledWith(
        '🚀 Running: commit-coach github --no-comment --no-status-check'
      );
    });

    it('should handle command execution failure', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExistsSync.mockReturnValue(true);
      const error = new Error('Command failed');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      await expect(runAction()).rejects.toThrow('process.exit(1)');
      expect(console.error).toHaveBeenCalledWith(
        '❌ Commit Coach analysis failed:',
        error
      );
    });

    it('should fail without GitHub token', async () => {
      await expect(runAction()).rejects.toThrow('process.exit(1)');
      expect(console.error).toHaveBeenCalledWith('❌ GitHub token is required');
    });

    it('should set GITHUB_TOKEN environment variable', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => Buffer.from(''));

      await runAction();

      expect(process.env.GITHUB_TOKEN).toBe('test-token');
    });
  });
});
