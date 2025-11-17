import { ComplexityMetrics } from '../../../types';

export class ComplexityAnalyzer {
  async analyze(content: string, language: string): Promise<ComplexityMetrics> {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

    // Calculate cyclomatic complexity (simplified)
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content, language);
    
    // Calculate cognitive complexity (simplified)
    const cognitiveComplexity = this.calculateCognitiveComplexity(content, language);
    
    // Calculate maintainability index
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity
    );

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      maintainabilityIndex,
    };
  }

  private calculateCyclomaticComplexity(content: string, language: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\band\b/g,
      /\bor\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCognitiveComplexity(content: string, language: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = content.split('\n');

    for (const line of lines) {
      // Track nesting level
      if (line.includes('{')) {
        nestingLevel++;
      }
      if (line.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      // Add complexity for control structures with nesting weight
      if (line.match(/\b(if|while|for|case)\b/)) {
        complexity += 1 + nestingLevel;
      }

      // Add complexity for logical operators
      const logicalOps = line.match(/&&|\|\|/g);
      if (logicalOps) {
        complexity += logicalOps.length;
      }

      // Add complexity for recursion
      if (line.includes('return') && line.includes('(')) {
        complexity += 1;
      }
    }

    return complexity;
  }

  private calculateMaintainabilityIndex(
    loc: number,
    cyclomatic: number,
    cognitive: number
  ): number {
    // Simplified maintainability index calculation
    // Real formula: MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    // Simplified version for this implementation
    
    const halsteadVolumeApprox = Math.log(loc) * 5;
    const mi = Math.max(
      0,
      171 - 5.2 * Math.log(halsteadVolumeApprox + 1) - 0.23 * cyclomatic - 16.2 * Math.log(loc + 1)
    );

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, mi));
  }
}
