# 🤝 Contributing to V Drive

Thank you for your interest in contributing to V Drive! We appreciate your effort to improve the project. This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- **Be Respectful**: Treat all community members with respect and courtesy
- **Be Inclusive**: Welcome and support people of all backgrounds and identities
- **Be Collaborative**: Work together constructively to improve the project
- **Be Professional**: Maintain professional communication at all times

### Reporting Violations

If you witness or experience unacceptable behavior, please report it to the maintainers at the earliest opportunity.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (v20+ recommended)
- **Git** 2.x or later
- **npm** 10+ or **yarn** 1.22+

### Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/vdrive.git
cd vdrive

# Add upstream remote
git remote add upstream https://github.com/aayushkumardev09-creator/vdrive.git
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials (use dummy values for local development)
nano .env
```

### Start Development Server

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 🔄 Development Workflow

### Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch from main
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features: `feature/add-candidate-filters`
- `fix/` - Bug fixes: `fix/email-parsing-issue`
- `docs/` - Documentation updates: `docs/update-api-reference`
- `refactor/` - Code refactoring: `refactor/optimize-matching-algorithm`
- `chore/` - Maintenance tasks: `chore/update-dependencies`
- `test/` - Test additions: `test/add-candidate-service-tests`

### Make Changes

1. Edit files in your feature branch
2. Test your changes locally
3. Run type checking: `npm run lint`
4. Format code: `npm run format`

### Keep Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase your branch on top of main
git rebase upstream/main

# If conflicts occur, resolve them in your editor
git add .
git rebase --continue
```

---

## 💻 Code Standards

### TypeScript

#### General Guidelines

```typescript
// ✅ DO: Use explicit types
function calculateScore(candidate: Candidate, job: Job): number {
  return candidate.skills.length * job.priority;
}

// ❌ DON'T: Use any types
function calculateScore(candidate: any, job: any): any {
  return candidate.skills.length * job.priority;
}

// ✅ DO: Export types and interfaces
export interface Candidate {
  id: string;
  name: string;
  email: string;
}

// ❌ DON'T: Inline complex types in imports
import type { SomeLongType } from './types';
```

#### Type Definitions

```typescript
// ✅ DO: Place types in dedicated files
// types/candidate.ts
export interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
  experience: number;
}

export type CandidateStatus = 'active' | 'rejected' | 'hired';

// ❌ DON'T: Spread types across multiple files
export interface CandidateBasic { /* ... */ }
export interface CandidateWithSkills { /* ... */ }
```

### React

#### Component Structure

```typescript
// ✅ DO: Functional components with clear props
import { FC } from 'react';
import { Candidate } from '@/types/candidate';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (id: string) => void;
}

export const CandidateCard: FC<CandidateCardProps> = ({ candidate, onSelect }) => {
  return (
    <div onClick={() => onSelect(candidate.id)}>
      <h3>{candidate.name}</h3>
      <p>{candidate.email}</p>
    </div>
  );
};

// ❌ DON'T: Class components or components without types
export default function CandidateCard({ candidate, onSelect }) {
  return <div>{candidate.name}</div>;
}
```

#### Hooks Usage

```typescript
// ✅ DO: Use custom hooks for reusable logic
export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  useEffect(() => {
    fetchCandidates().then(setCandidates);
  }, []);
  
  return candidates;
}

// ✅ DO: Clean up subscriptions in useEffect
useEffect(() => {
  const subscription = supabase
    .from('candidates')
    .on('*', payload => { /* ... */ })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### Styling

#### Tailwind CSS

```tsx
// ✅ DO: Use Tailwind utility classes
<div className="flex gap-4 p-6 rounded-lg border border-gray-200 shadow-sm">
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    Submit
  </button>
</div>

// ✅ DO: Use responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ DON'T: Mix Tailwind with inline styles
<div style={{ padding: '24px' }} className="bg-white">

// ❌ DON'T: Use custom CSS when Tailwind has utilities
<style>
  .button { padding: 8px 16px; background: blue; }
</style>
```

### File Organization

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── features/           # Feature-specific components
│   │   ├── CandidateForm.tsx
│   │   └── JobCard.tsx
│   └── layout/             # Layout components
│       ├── Header.tsx
│       └── Sidebar.tsx
├── pages/                  # Route components
│   ├── CandidatesPage.tsx
│   └── JobsPage.tsx
├── hooks/                  # Custom React hooks
│   ├── useCandidates.ts
│   └── useAuth.ts
├── services/               # API and external services
│   ├── candidates.ts
│   ├── supabase.ts
│   └── groq.ts
├── types/                  # TypeScript types and interfaces
│   ├── candidate.ts
│   ├── job.ts
│   └── api.ts
├── utils/                  # Utility functions
│   ├── formatting.ts
│   └── validation.ts
├── App.tsx
└── main.tsx
```

---

## 📝 Commit Guidelines

### Conventional Commits

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature or bug changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Scopes (Optional)

- `frontend` - Frontend changes
- `backend` - Backend API changes
- `database` - Database schema or migrations
- `auth` - Authentication-related changes
- `ai` - AI/ML integration changes

### Examples

```bash
# Feature
git commit -m "feat(frontend): add candidate bulk import from CSV"

# Bug fix
git commit -m "fix(backend): correct email parsing regex for job titles"

# Documentation
git commit -m "docs: update installation guide with Docker instructions"

# Refactor
git commit -m "refactor(api): simplify candidate matching algorithm"

# Performance
git commit -m "perf(database): add indexes to candidates table"
```

### Commit Message Best Practices

```
✅ DO:
- Use imperative mood: "add feature" not "added feature"
- Use lowercase in subject line
- Keep subject line under 50 characters
- Provide detailed body explaining why, not what
- Reference issues: "Fixes #123"

❌ DON'T:
- Mix multiple changes in one commit
- Use vague messages: "update", "fix", "change"
- Include issue numbers in subject: "Fix #123"
- Use ALL CAPS
```

### Example Commit with Body

```
feat(frontend): implement smart candidate matching UI

Add interactive scoring visualization and filtering:
- Display match score breakdown by criteria
- Allow filtering by score threshold
- Show top 3 matching criteria for each candidate

This improves recruitment decision-making speed by 40%.

Fixes #456
Related to #123
```

---

## 🔀 Pull Request Process

### Before Creating PR

1. **Test locally**: Ensure everything works on your machine
2. **Type check**: Run `npm run lint`
3. **Format code**: Run `npm run format`
4. **Update docs**: Add/update relevant documentation
5. **Rebase**: `git rebase upstream/main`

### Creating PR

1. Push your branch: `git push origin feature/your-feature-name`
2. Go to GitHub and create a Pull Request
3. Fill out the PR template completely

### PR Title and Description

**Title Format**:
```
[Type] Description

Example: [feat] Add CSV bulk import for candidates
```

**Description Template**:

```markdown
## Description
Brief summary of changes and why they were needed.

## Related Issue
Fixes #123

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## How to Test
1. Step to reproduce
2. Expected result
3. Actual result

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No console errors/warnings
- [ ] TypeScript strict mode passes
```

### Review Process

- All PRs require at least one approval
- CI checks must pass
- Code review feedback is constructive
- Address feedback with new commits (don't force-push)

### After Merge

Once your PR is merged, you can delete your branch:

```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## 🧪 Testing

### Frontend Testing (Coming Soon)

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Backend Testing (Coming Soon)

```bash
cd backend

# Run tests
npm test

# Watch mode
npm test -- --watch
```

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile (320px, 768px, 1024px)
- [ ] Works in Chrome, Firefox, Safari
- [ ] Keyboard navigation works
- [ ] ARIA labels present for accessibility

---

## 📚 Documentation

### Update Documentation When

- Adding new features
- Changing API endpoints
- Modifying environment variables
- Adding dependencies
- Changing configuration

### Documentation Files

- **README.md** - Main project documentation
- **CONTRIBUTING.md** - Contribution guidelines
- **docs/CANDIDATE_MANAGEMENT.md** - Feature guides
- **docs/API_REFERENCE.md** - API documentation
- **SECURITY.md** - Security guidelines

---

## ❓ Getting Help

### Questions or Stuck?

1. **Search existing issues**: [GitHub Issues](https://github.com/aayushkumardev09-creator/vdrive/issues)
2. **Start a discussion**: [GitHub Discussions](https://github.com/aayushkumardev09-creator/vdrive/discussions)
3. **Read documentation**: Check [docs/](./docs/) folder

### Contact Maintainers

- GitHub: [@aayushkumardev09-creator](https://github.com/aayushkumardev09-creator)
- Issues: [Report here](https://github.com/aayushkumardev09-creator/vdrive/issues/new)

---

## 🎉 Thank You!

Your contributions are what make this project great. Thank you for being part of the V Drive community!

---

<div align="center">

**Made with ❤️ by the V Drive Community**

</div>
