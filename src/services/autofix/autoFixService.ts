import { Octokit } from '@octokit/rest';
import { AutoFixResult, RefactoringSuggestion } from '../../types';

export class AutoFixService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(octokit: Octokit, owner: string, repo: string) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
  }

  async applyFixes(
    prNumber: number,
    branch: string,
    suggestions: RefactoringSuggestion[]
  ): Promise<AutoFixResult> {
    const filesModified: string[] = [];
    let formattingApplied = false;

    try {
      // Filter suggestions that can be auto-fixed
      const autoFixableSuggestions = suggestions.filter(s => 
        s.priority === 'high' && s.estimatedEffort === 'small' && s.code
      );

      if (autoFixableSuggestions.length === 0) {
        return {
          fixed: false,
          filesModified: [],
          formattingApplied: false,
        };
      }

      // Get branch reference
      const branchRef = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      });

      // Apply fixes for each suggestion
      for (const suggestion of autoFixableSuggestions) {
        if (suggestion.code) {
          const filePath = this.extractFilePath(suggestion.location);
          if (filePath) {
            await this.applyFixToFile(filePath, suggestion.code, branch);
            filesModified.push(filePath);
          }
        }
      }

      // Create commit with fixes
      if (filesModified.length > 0) {
        const commitMessage = `🤖 Auto-fix: Applied ${filesModified.length} suggested improvements\n\nFixed:\n${
          autoFixableSuggestions.map(s => `- ${s.title}`).join('\n')
        }`;

        // Note: In a real implementation, this would create an actual commit
        // For now, we're simulating the process
        formattingApplied = true;

        return {
          fixed: true,
          filesModified,
          commit: {
            sha: 'auto-fix-commit-sha',
            message: commitMessage,
          },
          formattingApplied,
        };
      }

    } catch (error) {
      console.error('Error applying auto-fixes:', error);
    }

    return {
      fixed: false,
      filesModified,
      formattingApplied,
    };
  }

  private extractFilePath(location: string): string | null {
    // Extract file path from location string (e.g., "src/file.ts:42" -> "src/file.ts")
    const match = location.match(/^([^:]+)/);
    return match ? match[1] : null;
  }

  private async applyFixToFile(
    filePath: string,
    codeChange: { before: string; after: string },
    branch: string
  ): Promise<void> {
    try {
      // Get current file content
      const { data: fileData } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: branch,
      });

      if ('content' in fileData) {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        
        // Apply the fix
        const updatedContent = content.replace(codeChange.before, codeChange.after);

        // Update file
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: `Auto-fix: Update ${filePath}`,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: fileData.sha,
          branch,
        });
      }
    } catch (error) {
      console.error(`Error fixing file ${filePath}:`, error);
      throw error;
    }
  }

  async addTests(filePath: string, branch: string): Promise<string[]> {
    // Placeholder for test generation
    // In a real implementation, this would use AI to generate appropriate tests
    const testFilePath = filePath.replace(/\.(ts|js|py|go|rs)$/, '.test.$1');
    
    return [testFilePath];
  }

  async formatCode(filePath: string, language: string): Promise<boolean> {
    // Placeholder for code formatting
    // In a real implementation, this would use appropriate formatters
    // (Prettier for JS/TS, Black for Python, gofmt for Go, rustfmt for Rust)
    
    return true;
  }

  async addTypeAnnotations(filePath: string, content: string): Promise<string> {
    // Placeholder for type annotation addition
    // In a real implementation, this would analyze code and add appropriate types
    
    return content;
  }
}
