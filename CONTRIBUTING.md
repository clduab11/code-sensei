# Contributing to Code Sensei

Thank you for your interest in contributing to Code Sensei! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a welcoming community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-org/code-sensei/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests in Issues
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Lint your code: `npm run lint`
7. Commit with clear messages
8. Push to your fork
9. Submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/code-sensei.git
cd code-sensei

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Run tests
npm test
```

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style (use Prettier)
- Add JSDoc comments for public APIs
- Write unit tests for new features
- Keep functions small and focused
- Use meaningful variable names

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(analysis): add support for Kotlin language
fix(security): resolve SQL injection detection false positives
docs(readme): update installation instructions
```

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Test edge cases
- Run the full test suite before submitting PR

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Questions?

Feel free to ask questions by:
- Opening a discussion in GitHub Discussions
- Joining our Discord community
- Emailing support@code-sensei.dev

Thank you for contributing! 🙏
