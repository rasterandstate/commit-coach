import { simpleGit, SimpleGit } from 'simple-git';
import { CommitInfo, ChangedFile } from '../types/index.js';

export class GitAnalyzer {
  private git: SimpleGit;

  constructor(repoPath: string = '.') {
    this.git = simpleGit(repoPath);
  }

  async getCommitInfo(commitHash: string): Promise<CommitInfo> {
    try {
      const [commit, diff] = await Promise.all([
        this.git.show([commitHash, '--format=%H|%s|%an|%ad', '--date=iso']),
        this.git.show([commitHash, '--stat', '--name-status']),
      ]);

      const [hash, message, author, dateStr] = commit.trim().split('|');
      const date = new Date(dateStr);

      const files = this.parseChangedFiles(diff);
      const fullDiff = await this.git.show([commitHash]);

      return {
        hash: hash.trim(),
        message: message.trim(),
        author: author.trim(),
        date,
        diff: fullDiff,
        files,
      };
    } catch (error) {
      throw new Error(`Failed to get commit info for ${commitHash}: ${error}`);
    }
  }

  async getCurrentCommit(): Promise<CommitInfo> {
    const hash = await this.git.revparse(['HEAD']);
    return this.getCommitInfo(hash.trim());
  }

  async getCommitRange(
    fromHash: string,
    toHash: string
  ): Promise<CommitInfo[]> {
    try {
      const log = await this.git.log({
        from: fromHash,
        to: toHash,
        format: { hash: '%H', message: '%s', author: '%an', date: '%ad' },
      });

      const commits: CommitInfo[] = [];
      for (const commit of log.all) {
        const commitInfo = await this.getCommitInfo(commit.hash);
        commits.push(commitInfo);
      }

      return commits;
    } catch (error) {
      throw new Error(
        `Failed to get commit range from ${fromHash} to ${toHash}: ${error}`
      );
    }
  }

  private parseChangedFiles(diffOutput: string): ChangedFile[] {
    const files: ChangedFile[] = [];
    const lines = diffOutput.split('\n');

    for (const line of lines) {
      if (line.includes('|')) {
        const [statusAndPath, changes] = line.split('|');
        const match = statusAndPath.match(/^(.+?)\s+(.+)$/);

        if (match) {
          const [, status, path] = match;
          const changeMatch = changes.match(/(\d+)\s+(\d+)/);

          if (changeMatch) {
            const [, additions, deletions] = changeMatch;
            files.push({
              path: path.trim(),
              status: this.parseFileStatus(status.trim()),
              additions: parseInt(additions, 10),
              deletions: parseInt(deletions, 10),
              diff: '', // Will be populated separately if needed
            });
          }
        }
      }
    }

    return files;
  }

  private parseFileStatus(
    status: string
  ): 'added' | 'modified' | 'deleted' | 'renamed' {
    if (status.includes('A')) return 'added';
    if (status.includes('D')) return 'deleted';
    if (status.includes('R')) return 'renamed';
    return 'modified';
  }

  async getFileDiff(commitHash: string, filePath: string): Promise<string> {
    try {
      return await this.git.show([`${commitHash}:${filePath}`]);
    } catch {
      return '';
    }
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }
}
