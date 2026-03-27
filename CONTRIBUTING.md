# Contributing to Armadarr Media Card

First off, thanks for taking the time to contribute! ❤️

The following is a set of guidelines for contributing to Armadarr Media Card. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related bugs.

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible. Fill out the [bug report template](https://github.com/totaldebug/armadarr-card/issues/new?template=bug_report.yml).

### Suggesting Enhancements
This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality. Following these guidelines helps maintainers and the community understand your suggestion and find related suggestions.

Before creating enhancement suggestions, please check the existing issues as you might find out that you don't need to create one. When you are creating an enhancement suggestion, please include as many details as possible. Fill out the [feature request template](https://github.com/totaldebug/armadarr-card/issues/new?template=feature_request.yml).

### Your First Code Contribution
Unsure where to begin contributing? You can start by looking through these `good first issue` and `help wanted` issues:
- [Good first issues](https://github.com/totaldebug/armadarr-card/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
- [Help wanted issues](https://github.com/totaldebug/armadarr-card/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)

## Styleguides

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

### TypeScript Styleguide
- We use ESLint and Prettier to enforce code style.
- Run `pnpm run lint` and `pnpm run format` before submitting a PR.

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development mode: `pnpm run watch`
4. Build for production: `pnpm run build`
