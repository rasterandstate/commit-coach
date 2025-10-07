/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubIntegration } from './github.js';
import { AnalysisResult, GitHubConfig } from '../types/index.js';

// Mock @octokit/rest
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => ({
    rest: {
      issues: {
        createComment: vi.fn(),
      },
      repos: {
        createCommitStatus: vi.fn(),
        getCommit: vi.fn(),
      },
      pulls: {
        list: vi.fn(),
      },
    },
  })),
}));

describe('GitHubIntegration', () => {
  let integration: GitHubIntegration;
  let mockConfig: GitHubConfig;
  let mockResult: AnalysisResult;
  let mockOctokit: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      token: 'test-token',
      owner: 'test-owner',
      repo: 'test-repo',
      prNumber: 123,
      commentOnPR: true,
      createStatusCheck: true,
    };

    mockResult = {
      commit: {
        hash: 'abc12345',
        message: 'Test commit message',
        author: 'Test Author',
        date: new Date('2023-01-01T00:00:00Z'),
        diff: 'diff content',
        files: [],
      },
      insights: [
        {
          id: 'test-insight',
          type: 'warning' as const,
          title: 'Test Warning',
          message: 'This is a test warning message',
          confidence: 0.8,
        },
      ],
      summary: {
        totalLines: 10,
        filesChanged: 1,
        testFilesChanged: 0,
        documentationFilesChanged: 0,
      },
    };

    integration = new GitHubIntegration(mockConfig);
    mockOctokit = (integration as any).octokit;
  });

  describe('postComment', () => {
    it('should post comment to PR', async () => {
      mockOctokit.rest.issues.createComment.mockResolvedValue({
        data: { id: 1 },
      });

      await integration.postComment(mockResult);

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: expect.stringContaining('## 🔍 Commit Coach Analysis'),
      });
    });

    it('should not post comment when commentOnPR is false', async () => {
      const configWithoutComment = { ...mockConfig, commentOnPR: false };
      const integrationWithoutComment = new GitHubIntegration(
        configWithoutComment
      );

      await integrationWithoutComment.postComment(mockResult);

      expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    });

    it('should not post comment when prNumber is not provided', async () => {
      const configWithoutPR = { ...mockConfig, prNumber: undefined };
      const integrationWithoutPR = new GitHubIntegration(configWithoutPR);

      await integrationWithoutPR.postComment(mockResult);

      expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    });

    it('should handle comment posting errors', async () => {
      mockOctokit.rest.issues.createComment.mockRejectedValue(
        new Error('API Error')
      );

      await expect(integration.postComment(mockResult)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('createStatusCheck', () => {
    it('should create success status check for no errors', async () => {
      const resultWithNoErrors = { ...mockResult, insights: [] };
      mockOctokit.rest.repos.createCommitStatus.mockResolvedValue({
        data: { id: 1 },
      });

      await integration.createStatusCheck(resultWithNoErrors, 'abc12345');

      expect(mockOctokit.rest.repos.createCommitStatus).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'abc12345',
        state: 'success',
        target_url: 'https://github.com/test-owner/test-repo/commit/abc12345',
        description: 'Commit Coach: No issues found',
        context: 'commit-coach/analysis',
      });
    });

    it('should create failure status check for errors', async () => {
      const resultWithErrors = {
        ...mockResult,
        insights: [
        {
          id: 'error1',
          type: 'error' as const,
          title: 'Error 1',
          message: 'Error message',
          confidence: 0.9,
        },
        {
          id: 'error2',
          type: 'error' as const,
          title: 'Error 2',
          message: 'Error message',
          confidence: 0.8,
        },
        {
          id: 'warning',
          type: 'warning' as const,
          title: 'Warning',
          message: 'Warning message',
          confidence: 0.7,
        },
        ],
      };

      mockOctokit.rest.repos.createCommitStatus.mockResolvedValue({
        data: { id: 1 },
      });

      await integration.createStatusCheck(resultWithErrors, 'abc12345');

      expect(mockOctokit.rest.repos.createCommitStatus).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'abc12345',
        state: 'failure',
        target_url: 'https://github.com/test-owner/test-repo/commit/abc12345',
        description: 'Commit Coach: 2 error(s) found',
        context: 'commit-coach/analysis',
      });
    });

    it('should create neutral status check for warnings only', async () => {
      const resultWithWarnings = {
        ...mockResult,
        insights: [
        {
          id: 'warning1',
          type: 'warning' as const,
          title: 'Warning 1',
          message: 'Warning message',
          confidence: 0.8,
        },
        {
          id: 'warning2',
          type: 'warning' as const,
          title: 'Warning 2',
          message: 'Warning message',
          confidence: 0.7,
        },
        ],
      };

      mockOctokit.rest.repos.createCommitStatus.mockResolvedValue({
        data: { id: 1 },
      });

      await integration.createStatusCheck(resultWithWarnings, 'abc12345');

      expect(mockOctokit.rest.repos.createCommitStatus).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'abc12345',
        state: 'success',
        target_url: 'https://github.com/test-owner/test-repo/commit/abc12345',
        description: 'Commit Coach: 2 warning(s) found',
        context: 'commit-coach/analysis',
      });
    });

    it('should not create status check when createStatusCheck is false', async () => {
      const configWithoutStatusCheck = {
        ...mockConfig,
        createStatusCheck: false,
      };
      const integrationWithoutStatusCheck = new GitHubIntegration(
        configWithoutStatusCheck
      );

      await integrationWithoutStatusCheck.createStatusCheck(
        mockResult,
        'abc12345'
      );

      expect(mockOctokit.rest.repos.createCommitStatus).not.toHaveBeenCalled();
    });

    it('should handle status check creation errors', async () => {
      mockOctokit.rest.repos.createCommitStatus.mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        integration.createStatusCheck(mockResult, 'abc12345')
      ).rejects.toThrow('API Error');
    });
  });

  describe('getPRNumber', () => {
    it('should find PR number for commit', async () => {
      const mockPulls = {
        data: [{ number: 123, head: { sha: 'abc12345' } }],
      };

      mockOctokit.rest.pulls.list.mockResolvedValue(mockPulls);

      const result = await integration.getPRNumber('abc12345');

      expect(result).toBe(123);
      expect(mockOctokit.rest.pulls.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'open',
        head: 'test-owner:abc12345',
      });
    });

    it('should search all PRs when not found in open PRs', async () => {
      const mockOpenPulls = { data: [] };
      const mockAllPulls = {
        data: [{ number: 456, head: { sha: 'abc12345' } }],
      };

      mockOctokit.rest.pulls.list
        .mockResolvedValueOnce(mockOpenPulls)
        .mockResolvedValueOnce(mockAllPulls);

      const result = await integration.getPRNumber('abc12345');

      expect(result).toBe(456);
      expect(mockOctokit.rest.pulls.list).toHaveBeenCalledTimes(2);
    });

    it('should return null when no PR found', async () => {
      const mockPulls = { data: [] };

      mockOctokit.rest.pulls.list
        .mockResolvedValueOnce(mockPulls)
        .mockResolvedValueOnce(mockPulls);

      const result = await integration.getPRNumber('abc12345');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockOctokit.rest.pulls.list.mockRejectedValue(new Error('API Error'));

      const result = await integration.getPRNumber('abc12345');

      expect(result).toBeNull();
    });
  });

  describe('getCommitInfo', () => {
    it('should get commit information', async () => {
      const mockCommit = {
        data: {
          sha: 'abc12345',
          commit: {
            message: 'Test commit message',
            author: { name: 'Test Author' },
          },
        },
      };

      mockOctokit.rest.repos.getCommit.mockResolvedValue(mockCommit);

      const result = await integration.getCommitInfo('abc12345');

      expect(result).toBe(mockCommit.data);
      expect(mockOctokit.rest.repos.getCommit).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'abc12345',
      });
    });

    it('should handle commit info errors', async () => {
      mockOctokit.rest.repos.getCommit.mockRejectedValue(
        new Error('Commit not found')
      );

      await expect(integration.getCommitInfo('invalid')).rejects.toThrow(
        'Commit not found'
      );
    });
  });
});
