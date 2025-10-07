import { Octokit } from '@octokit/rest';
import { AnalysisResult, GitHubConfig } from '../types/index.js';
import { CommentFormatter } from '../output/formatters.js';

export class GitHubIntegration {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.config = config;
  }

  async postComment(result: AnalysisResult): Promise<void> {
    if (!this.config.commentOnPR || !this.config.prNumber) {
      return;
    }

    const formatter = new CommentFormatter({
      format: 'comment',
      includeSummary: true,
      maxInsights: 10,
    });

    const comment = formatter.format(result);

    try {
      await this.octokit.rest.issues.createComment({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: this.config.prNumber,
        body: comment,
      });

      console.log(`✅ Posted comment to PR #${this.config.prNumber}`);
    } catch (error) {
      console.error(`❌ Failed to post comment: ${error}`);
      throw error;
    }
  }

  async createStatusCheck(
    result: AnalysisResult,
    commitSha: string
  ): Promise<void> {
    if (!this.config.createStatusCheck) {
      return;
    }

    const errorCount = result.insights.filter(i => i.type === 'error').length;
    const warningCount = result.insights.filter(
      i => i.type === 'warning'
    ).length;

    let state: 'success' | 'failure' | 'pending';
    let description: string;

    if (errorCount > 0) {
      state = 'failure';
      description = `${errorCount} error(s) found`;
    } else if (warningCount > 0) {
      state = 'success';
      description = `${warningCount} warning(s) found`;
    } else {
      state = 'success';
      description = 'No issues found';
    }

    try {
      await this.octokit.rest.repos.createCommitStatus({
        owner: this.config.owner,
        repo: this.config.repo,
        sha: commitSha,
        state,
        target_url: `https://github.com/${this.config.owner}/${this.config.repo}/commit/${commitSha}`,
        description: `Commit Coach: ${description}`,
        context: 'commit-coach/analysis',
      });

      console.log(`✅ Created status check: ${state} - ${description}`);
    } catch (error) {
      console.error(`❌ Failed to create status check: ${error}`);
      throw error;
    }
  }

  async getPRNumber(commitSha: string): Promise<number | null> {
    try {
      const { data: pulls } = await this.octokit.rest.pulls.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open',
        head: `${this.config.owner}:${commitSha}`,
      });

      if (pulls.length > 0) {
        return pulls[0].number;
      }

      // If not found in open PRs, check all PRs
      const { data: allPulls } = await this.octokit.rest.pulls.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'all',
        head: `${this.config.owner}:${commitSha}`,
      });

      return allPulls.length > 0 ? allPulls[0].number : null;
    } catch (error) {
      console.warn(`Could not find PR for commit ${commitSha}: ${error}`);
      return null;
    }
  }

  async getCommitInfo(commitSha: string): Promise<Record<string, unknown>> {
    try {
      const { data: commit } = await this.octokit.rest.repos.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: commitSha,
      });

      return commit;
    } catch (error) {
      console.error(`Failed to get commit info: ${error}`);
      throw error;
    }
  }
}
