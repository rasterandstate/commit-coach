import { simpleGit, SimpleGit } from 'simple-git';
import { CommitInfo, ChangedFile } from '../types/index.js';

export class GitAnalyzer {
  private git: SimpleGit;

  constructor(repoPath: string = '.') {
    this.git = simpleGit(repoPath);
  }

  async getCommitInfo(commitHash: string): Promise<CommitInfo> {
    try {
      const [commit, diff, fullDiff] = await Promise.all([
        this.git.show([
          commitHash,
          '--format=%H|%s|%an|%ad',
          '--date=iso',
          '--no-patch',
        ]),
        this.git.show([commitHash, '--stat', '--name-status']),
        this.git.show([commitHash]),
      ]);

      const [hash, message, author, dateStr] = commit.trim().split('|');
      // Parse date string - handle timezone offset by removing space before timezone
      const cleanDateStr = dateStr.replace(' -', '-').replace(' +', '+');
      const date = new Date(cleanDateStr);

      const files = this.parseChangedFiles(diff);

      // Calculate line counts from the full diff
      this.calculateLineCounts(files, fullDiff);

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
      // Skip empty lines and commit info lines
      if (
        !line.trim() ||
        line.startsWith('commit') ||
        line.startsWith('Author') ||
        line.startsWith('Date')
      ) {
        continue;
      }

      // Parse name-status format: "M\tpath/to/file" or "A\tpath/to/file"
      const match = line.match(/^([AMD])\t(.+)$/);
      if (match) {
        const [, status, path] = match;
        files.push({
          path: path.trim(),
          status: this.parseFileStatus(status.trim()),
          additions: 0, // Will be calculated from diff if needed
          deletions: 0, // Will be calculated from diff if needed
          diff: '', // Will be populated separately if needed
        });
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

  private calculateLineCounts(files: ChangedFile[], fullDiff: string): void {
    const diffSections = fullDiff.split('diff --git');

    for (const file of files) {
      // Find the diff section for this file
      const fileSection = diffSections.find(
        section =>
          section.includes(`a/${file.path}`) ||
          section.includes(`b/${file.path}`)
      );

      if (fileSection) {
        const lines = fileSection.split('\n');
        let additions = 0;
        let deletions = 0;

        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            additions++;
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            deletions++;
          }
        }

        file.additions = additions;
        file.deletions = deletions;
      }
    }
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
