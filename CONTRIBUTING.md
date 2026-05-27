# Contributing to V Drive

Thank you for your interest in contributing to V Drive! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors and maintainers.

## Getting Started

### Prerequisites

- Node.js 20+ (matches CI)
- npm
- A GitHub account
- Supabase project and webhook URLs (see `.env.example`)

### Setup Development Environment

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/vdrive.git
   cd vdrive
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/aayushkumardev09-creator/vdrive.git
   ```

4. **Install dependencies**:
   ```bash
   cp .env.example .env
   npm ci
   ```

5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Running the Project

- **Development server**:
  ```bash
  npm run dev
  ```
  The app will be available at `http://localhost:3000`

- **Build for production**:
  ```bash
  npm run build
  ```

- **Type checking**:
  ```bash
  npm run lint
  ```

## Making Changes

### Code Style

This project uses:
- **Prettier** for code formatting (optional locally via `npm run format`)
- **TypeScript** for type safety (`npm run lint` runs `tsc --noEmit`)

### Before Committing

1. **Format your code** (optional):
   ```bash
   npm run format
   ```

2. **Type check** (required):
   ```bash
   npm run lint
   ```

3. **Production build** (required):
   ```bash
   npm run build
   ```

### Commit Message Guidelines

Use clear, descriptive commit messages following this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build, dependency, or tooling changes
- `ci`: CI/CD configuration changes

**Examples:**
```
feat(smart-match): add batch candidate selection
fix(submissions): resolve email encoding issue
docs: update setup instructions
chore: upgrade react to v19.1.0
```

## Submitting Changes

### Creating a Pull Request

1. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues (e.g., "Fixes #123")
   - Provide a detailed description of changes
   - Ensure your PR passes all CI checks

3. **PR Requirements**:
   - CI passes (`npm run lint` and `npm run build`)
   - No TypeScript errors
   - No committed secrets or `.env` files
   - At least one maintainer approval

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
Describe how you tested these changes

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] My changes generate no new warnings
- [ ] I have added tests (if applicable)
```

## Project Structure

```
vdrive/
├── src/
│   ├── components/     # Layout and shared UI
│   ├── pages/          # Route-level views
│   └── lib/            # Supabase, config, AI, utilities
├── workflows/          # Activepieces JSON exports
├── .github/workflows/  # CI
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Important Files

- **package.json**: Project dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **vite.config.ts**: Vite build configuration
- **.eslintrc.json**: ESLint configuration
- **.prettierrc**: Prettier formatting configuration
- **.editorconfig**: Cross-editor consistency settings

## Common Issues

### Port Already in Use
If port 3000 is in use, modify the dev command:
```bash
npm run dev -- --port 3001
```

### Dependencies Issues
Clear node_modules and reinstall from the lockfile:
```bash
rm -rf node_modules
npm ci
```

### TypeScript Errors
Ensure your types are correct and imports are valid:
```bash
npm run lint
```

## Reporting Bugs

When reporting a bug, please include:
- A clear description of the issue
- Steps to reproduce the behavior
- Expected vs. actual behavior
- Screenshots or error logs (if applicable)
- Your environment (Node.js version, OS, etc.)

## Feature Requests

Feature requests are welcome! Please include:
- A clear description of the proposed feature
- Why this feature would be useful
- Example use cases
- Any implementation suggestions

## Questions?

If you have questions, feel free to:
- Open a GitHub discussion
- Check existing issues for similar questions
- Contact the maintainers

## License

By contributing to V Drive, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to V Drive! 🚀
