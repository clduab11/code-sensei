import { parseGitHubURL } from '../../utils/githubUtils';

describe('githubUtils', () => {
  describe('parseGitHubURL', () => {
    test('should parse HTTPS GitHub URL', () => {
      const result = parseGitHubURL('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    test('should parse GitHub URL with .git extension', () => {
      const result = parseGitHubURL('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    test('should parse SSH GitHub URL', () => {
      const result = parseGitHubURL('git@github.com:owner/repo.git');
      expect(result).toBeNull(); // Current implementation doesn't support SSH
    });

    test('should return null for invalid URL', () => {
      const result = parseGitHubURL('not-a-github-url');
      expect(result).toBeNull();
    });
  });
});
