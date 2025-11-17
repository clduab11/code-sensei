import { Octokit } from '@octokit/rest';
import { PullRequestContext, ReviewIssue, AutoFixResult } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';
import * as Diff from 'diff';

export class AutoFixService {
  /**
   * Apply auto-fixes to a pull request
   */
  async applyAutoFixes(
    context: PullRequestContext,
    issues: ReviewIssue[],
    octokit: Octokit
  ): Promise<AutoFixResult[]> {
    if (!config.features.autoFix) {
      logger.info('Auto-fix feature is disabled');
      return [];
    }

    const fixableIssues = issues.filter((issue) => issue.autoFixable);

    if (fixableIssues.length === 0) {
      logger.info('No auto-fixable issues found');
      return [];
    }

    logger.info(`Attempting to auto-fix ${fixableIssues.length} issues`);

    const fixes: AutoFixResult[] = [];
    const fileContents = new Map<string, string>();

    // Group issues by file
    const issuesByFile = this.groupIssuesByFile(fixableIssues);

    for (const [filename, fileIssues] of issuesByFile.entries()) {
      try {
        // Fetch file content
        const { data: fileData } = await octokit.repos.getContent({
          owner: context.owner,
          repo: context.repo,
          path: filename,
          ref: context.ref,
        });

        if (!('content' in fileData)) continue;

        const originalContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
        let fixedContent = originalContent;

        // Apply fixes
        for (const issue of fileIssues) {
          fixedContent = this.applyFix(fixedContent, issue);
        }

        if (fixedContent !== originalContent) {
          const diffResult = Diff.createPatch(filename, originalContent, fixedContent);

          fixes.push({
            file: filename,
            original: originalContent,
            fixed: fixedContent,
            diff: diffResult,
            description: `Auto-fixed ${fileIssues.length} issues`,
            issuesFixed: fileIssues.map((i) => i.code || i.message),
          });

          fileContents.set(filename, fixedContent);
        }
      } catch (error) {
        logger.error('Failed to apply auto-fix', {
          file: filename,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Create commit with fixes
    if (fixes.length > 0) {
      await this.createFixCommit(context, fileContents, octokit);
    }

    return fixes;
  }

  /**
   * Apply a single fix to content
   */
  private applyFix(content: string, issue: ReviewIssue): string {
    const lines = content.split('\n');

    if (!issue.line || issue.line > lines.length) {
      return content;
    }

    const lineIndex = issue.line - 1;
    const line = lines[lineIndex];

    switch (issue.code) {
      case 'no-var':
        lines[lineIndex] = line.replace(/\bvar\b/, 'const');
        break;

      case 'no-console':
        lines[lineIndex] = ''; // Remove console statements
        break;

      case 'no-debugger':
        lines[lineIndex] = ''; // Remove debugger statements
        break;

      case 'missing-semicolon':
        lines[lineIndex] = line.trimEnd() + ';';
        break;

      case 'trailing-whitespace':
        lines[lineIndex] = line.trimEnd();
        break;

      case 'double-quotes':
        lines[lineIndex] = line.replace(/"/g, "'");
        break;

      default:
        // Try to apply suggestion if available
        if (issue.suggestion) {
          logger.info('Custom fix not implemented for:', issue.code);
        }
    }

    return lines.join('\n');
  }

  /**
   * Create a commit with auto-fixes
   */
  private async createFixCommit(
    context: PullRequestContext,
    fileContents: Map<string, string>,
    octokit: Octokit
  ) {
    try {
      // Get current commit
      const { data: currentCommit } = await octokit.git.getCommit({
        owner: context.owner,
        repo: context.repo,
        commit_sha: context.sha,
      });

      // Create blobs for changed files
      const blobs = await Promise.all(
        Array.from(fileContents.entries()).map(async ([path, content]) => {
          const { data: blob } = await octokit.git.createBlob({
            owner: context.owner,
            repo: context.repo,
            content: Buffer.from(content).toString('base64'),
            encoding: 'base64',
          });
          return { path, sha: blob.sha };
        })
      );

      // Get current tree
      const { data: currentTree } = await octokit.git.getTree({
        owner: context.owner,
        repo: context.repo,
        tree_sha: currentCommit.tree.sha,
        recursive: 'true',
      });

      // Create new tree with updated files
      const tree = currentTree.tree.map((item) => {
        const blob = blobs.find((b) => b.path === item.path);
        if (blob) {
          return { ...item, sha: blob.sha };
        }
        return item;
      });

      const { data: newTree } = await octokit.git.createTree({
        owner: context.owner,
        repo: context.repo,
        tree: tree as any,
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: context.owner,
        repo: context.repo,
        message: '🤖 Auto-fix: Applied automated code fixes\n\nFixed by Code Sensei',
        tree: newTree.sha,
        parents: [context.sha],
      });

      // Update reference
      await octokit.git.updateRef({
        owner: context.owner,
        repo: context.repo,
        ref: `heads/${context.ref}`,
        sha: newCommit.sha,
      });

      logger.info('Auto-fix commit created', {
        sha: newCommit.sha,
        filesChanged: fileContents.size,
      });
    } catch (error) {
      logger.error('Failed to create auto-fix commit', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private groupIssuesByFile(issues: ReviewIssue[]): Map<string, ReviewIssue[]> {
    const grouped = new Map<string, ReviewIssue[]>();

    for (const issue of issues) {
      const existing = grouped.get(issue.file) || [];
      existing.push(issue);
      grouped.set(issue.file, existing);
    }

    return grouped;
  }
}
