import { CodeAnalysisResult } from '../../types';
import { PythonAnalyzer } from './analyzers/pythonAnalyzer';
import { TypeScriptAnalyzer } from './analyzers/typescriptAnalyzer';
import { GoAnalyzer } from './analyzers/goAnalyzer';
import { RustAnalyzer } from './analyzers/rustAnalyzer';
import { SecurityScanner } from './scanners/securityScanner';
import { ComplexityAnalyzer } from './analyzers/complexityAnalyzer';

export class CodeAnalysisService {
  private pythonAnalyzer: PythonAnalyzer;
  private typescriptAnalyzer: TypeScriptAnalyzer;
  private goAnalyzer: GoAnalyzer;
  private rustAnalyzer: RustAnalyzer;
  private securityScanner: SecurityScanner;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor() {
    this.pythonAnalyzer = new PythonAnalyzer();
    this.typescriptAnalyzer = new TypeScriptAnalyzer();
    this.goAnalyzer = new GoAnalyzer();
    this.rustAnalyzer = new RustAnalyzer();
    this.securityScanner = new SecurityScanner();
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  async analyzeFiles(files: any[]): Promise<CodeAnalysisResult[]> {
    const results: CodeAnalysisResult[] = [];

    for (const file of files) {
      const language = this.detectLanguage(file.filename);
      
      if (!language) {
        continue; // Skip unsupported file types
      }

      try {
        // Fetch file content (would need actual implementation)
        const content = await this.fetchFileContent(file);
        
        // Perform static analysis
        const issues = await this.analyzeByLanguage(language, content, file.filename);
        
        // Calculate complexity metrics
        const complexity = await this.complexityAnalyzer.analyze(content, language);
        
        // Scan for security issues
        const securityIssues = await this.securityScanner.scan(content, language, file.filename);

        results.push({
          file: file.filename,
          language,
          issues,
          complexity,
          securityIssues,
        });
      } catch (error) {
        console.error(`Error analyzing file ${file.filename}:`, error);
      }
    }

    return results;
  }

  private detectLanguage(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: { [key: string]: string } = {
      'py': 'python',
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'go': 'go',
      'rs': 'rust',
    };

    return languageMap[ext || ''] || null;
  }

  private async analyzeByLanguage(language: string, content: string, filename: string) {
    switch (language) {
      case 'python':
        return await this.pythonAnalyzer.analyze(content, filename);
      case 'typescript':
      case 'javascript':
        return await this.typescriptAnalyzer.analyze(content, filename);
      case 'go':
        return await this.goAnalyzer.analyze(content, filename);
      case 'rust':
        return await this.rustAnalyzer.analyze(content, filename);
      default:
        return [];
    }
  }

  private async fetchFileContent(file: any): Promise<string> {
    // In a real implementation, this would fetch the file content from GitHub
    // For now, return a placeholder
    return file.patch || '';
  }
}
