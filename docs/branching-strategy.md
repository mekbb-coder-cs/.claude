# Branching Strategy & Workflow Guide

## Branch Structure
- **`main`**: Production-ready, stable codebase. Direct commits are restricted. All releases and tags stem from here.
- **`develop`**: Primary integration branch for ongoing development. Feature branches merge into `develop` via pull requests.
- **`feature/*`**: Dedicated branches for specific features or components (e.g. `feature/auth-endpoints`, `feature/booking-ui`).
- **`bugfix/*`**: Branches for bug fixes during active development or testing.
- **`hotfix/*`**: Critical production fixes branched directly off `main` and merged back into both `main` and `develop`.

## Workflow
1. Branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/room-search
   ```
2. Commit with conventional commit messages (`feat: ...`, `fix: ...`, `chore: ...`).
3. Open a Pull Request targeting `develop`.
4. Once tested, promote `develop` into `main` for release.
