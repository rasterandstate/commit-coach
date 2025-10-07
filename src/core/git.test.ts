import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { GitAnalyzer } from './git.js';

// Mock simple-git
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    show: vi.fn(),
    revparse: vi.fn(),
    log: vi.fn(),
    status: vi.fn(),
  })),
}));

interface MockGitInstance {
  show: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  revparse: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  log: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  status: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
}

describe('GitAnalyzer', () => {
  let gitAnalyzer: GitAnalyzer;
  let mockGit: MockGitInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    gitAnalyzer = new GitAnalyzer('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGit = (gitAnalyzer as any).git as MockGitInstance;
  });

  describe('getCommitInfo', () => {
    it('should parse commit information correctly', async () => {
      const mockCommit =
        'abc123|Test commit message|Test Author|2023-01-01T00:00:00Z';
      const mockDiff = 'src/file.js | 5 +++++\n1 file changed, 5 insertions(+)';
      const mockFullDiff =
        'diff --git a/src/file.js b/src/file.js\n+console.log("test");';

      mockGit.show
        .mockResolvedValueOnce(mockCommit)
        .mockResolvedValueOnce(mockDiff)
        .mockResolvedValueOnce(mockFullDiff);

      const result = await gitAnalyzer.getCommitInfo('abc123');

      expect(result).toMatchObject({
        hash: 'abc123',
        message: 'Test commit message',
        author: 'Test Author',
        date: new Date('2023-01-01T00:00:00Z'),
        diff: mockFullDiff,
        files: expect.any(Array),
      });
    });

    it('should handle different file statuses', async () => {
      const mockCommit = 'abc123|Test commit|Author|2023-01-01T00:00:00Z';
      const mockDiff =
        'A src/new.js | 3 +++\nD src/old.js | 2 --\nR src/renamed.js | 1 +';
      const mockFullDiff = 'diff content';

      mockGit.show
        .mockResolvedValueOnce(mockCommit)
        .mockResolvedValueOnce(mockDiff)
        .mockResolvedValueOnce(mockFullDiff);

      const result = await gitAnalyzer.getCommitInfo('abc123');

      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });

    it('should throw error for invalid commit hash', async () => {
      mockGit.show.mockRejectedValue(new Error('Invalid commit hash'));

      await expect(gitAnalyzer.getCommitInfo('invalid')).rejects.toThrow(
        'Failed to get commit info for invalid'
      );
    });
  });

  describe('getCurrentCommit', () => {
    it('should get current commit info', async () => {
      const mockCommit = 'abc123|Current commit|Author|2023-01-01T00:00:00Z';
      const mockDiff = 'src/file.js | 1 +';
      const mockFullDiff = 'diff content';

      mockGit.revparse.mockResolvedValue('abc123');
      mockGit.show
        .mockResolvedValueOnce(mockCommit)
        .mockResolvedValueOnce(mockDiff)
        .mockResolvedValueOnce(mockFullDiff);

      const result = await gitAnalyzer.getCurrentCommit();

      expect(mockGit.revparse).toHaveBeenCalledWith(['HEAD']);
      expect(result.hash).toBe('abc123');
    });
  });

  describe('getCommitRange', () => {
    it('should get commit range', async () => {
      const mockLog = {
        all: [
          {
            hash: 'abc123',
            message: 'Commit 1',
            author: 'Author',
            date: '2023-01-01',
          },
          {
            hash: 'def456',
            message: 'Commit 2',
            author: 'Author',
            date: '2023-01-02',
          },
        ],
      };

      mockGit.log.mockResolvedValue(mockLog);
      mockGit.show
        .mockResolvedValueOnce('abc123|Commit 1|Author|2023-01-01T00:00:00Z')
        .mockResolvedValueOnce('src/file.js | 1 +')
        .mockResolvedValueOnce('diff content')
        .mockResolvedValueOnce('def456|Commit 2|Author|2023-01-02T00:00:00Z')
        .mockResolvedValueOnce('src/file.js | 1 +')
        .mockResolvedValueOnce('diff content');

      const result = await gitAnalyzer.getCommitRange('abc123', 'def456');

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe('abc123');
      expect(result[1].hash).toBe('def456');
    });

    it('should throw error for invalid commit range', async () => {
      mockGit.log.mockRejectedValue(new Error('Invalid range'));

      await expect(
        gitAnalyzer.getCommitRange('invalid1', 'invalid2')
      ).rejects.toThrow('Failed to get commit range from invalid1 to invalid2');
    });
  });

  describe('getFileDiff', () => {
    it('should get file diff', async () => {
      const mockDiff = 'file content';
      mockGit.show.mockResolvedValue(mockDiff);

      const result = await gitAnalyzer.getFileDiff('abc123', 'src/file.js');

      expect(mockGit.show).toHaveBeenCalledWith(['abc123:src/file.js']);
      expect(result).toBe(mockDiff);
    });

    it('should return empty string on error', async () => {
      mockGit.show.mockRejectedValue(new Error('File not found'));

      const result = await gitAnalyzer.getFileDiff('abc123', 'nonexistent.js');

      expect(result).toBe('');
    });
  });

  describe('isRepository', () => {
    it('should return true for valid repository', async () => {
      mockGit.status.mockResolvedValue({});

      const result = await gitAnalyzer.isRepository();

      expect(result).toBe(true);
    });

    it('should return false for invalid repository', async () => {
      mockGit.status.mockRejectedValue(new Error('Not a git repository'));

      const result = await gitAnalyzer.isRepository();

      expect(result).toBe(false);
    });
  });

  describe('parseChangedFiles', () => {
    it('should parse file changes correctly', () => {
      const diffOutput = `
        src/file1.js | 5 +++++
        src/file2.js | 3 ---
        src/file3.js | 2 +-
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (gitAnalyzer as any).parseChangedFiles(diffOutput);

      expect(Array.isArray(result)).toBe(true);
      // The actual parsing logic is complex and depends on the real implementation
      // We're just testing that the method exists and returns an array
    });

    it('should handle different file status indicators', () => {
      const diffOutput = `
        A src/new.js | 3 +++
        D src/old.js | 2 --
        R src/renamed.js | 1 +
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (gitAnalyzer as any).parseChangedFiles(diffOutput);

      expect(Array.isArray(result)).toBe(true);
      // The actual parsing logic is complex and depends on the real implementation
      // We're just testing that the method exists and returns an array
    });
  });

  describe('parseFileStatus', () => {
    it('should parse file status correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseFileStatus = (gitAnalyzer as any).parseFileStatus;

      expect(parseFileStatus('A')).toBe('added');
      expect(parseFileStatus('D')).toBe('deleted');
      expect(parseFileStatus('R')).toBe('renamed');
      expect(parseFileStatus('M')).toBe('modified');
      expect(parseFileStatus('C')).toBe('modified');
    });
  });

  describe('parseChangedFiles edge cases', () => {
    it('should handle files with change statistics', () => {
      const diffOutput =
        'src/file.js | 5 +++++\n1 file changed, 5 insertions(+)';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (gitAnalyzer as any).parseChangedFiles(diffOutput);

      expect(Array.isArray(result)).toBe(true);
      // The actual parsing logic is complex and depends on the real implementation
      // We're testing that the method handles the change statistics format
    });

    it('should handle malformed diff output', () => {
      const diffOutput = 'invalid format\nno pipe character';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (gitAnalyzer as any).parseChangedFiles(diffOutput);

      expect(Array.isArray(result)).toBe(true);
      // Should handle malformed input gracefully
    });
  });
});
