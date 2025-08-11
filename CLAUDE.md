# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build
```bash
npm run build          # Compile TypeScript to JavaScript (src -> lib)
npm run package        # Bundle with ncc for distribution (creates dist/index.js)
npm run all           # Full build pipeline: build, format, lint, package, and test
```

### Code Quality
```bash
npm run lint          # Run ESLint on TypeScript source files
npm run format        # Format code with Prettier
npm run format-check  # Check formatting without modifying files
```

### Testing
```bash
npm test              # Run Jest tests (looks for *.test.ts files)
```

## Architecture

This is a GitHub Action for installing the Flipt CLI. The codebase follows a standard GitHub Action structure:

### Key Components

1. **Entry Point**: `src/main.ts`
   - Parses action inputs (version, args, working-directory, GITHUB_TOKEN)
   - Orchestrates Flipt CLI download and execution
   - Handles error reporting to GitHub Actions

2. **CLI Downloader**: `src/lib/cli.ts`
   - Downloads platform-specific Flipt binaries from GitHub releases
   - Supports linux/darwin on x86_64/arm64 architectures
   - Caches downloaded binaries using GitHub Actions tool cache
   - Uses Octokit for authenticated GitHub API calls
   - Implements intelligent version resolution for v1/v2 compatibility

3. **Execution Layer**: `src/lib/exec.ts`
   - Wrapper around @actions/exec for running shell commands
   - Returns structured results with stdout/stderr and success status

4. **Environment**: `src/lib/environment.ts`
   - Validates required environment variables using envalid
   - Currently requires GITHUB_WORKSPACE

### Build Process

The action uses a dual compilation approach:
1. TypeScript compilation (`tsc`): src/*.ts → lib/*.js
2. ncc bundling: Creates single dist/index.js with all dependencies

The action.yml specifies `dist/index.js` as the entry point, so always run `npm run package` before committing distribution changes.

### Action Inputs

- `version`: Flipt version to install (default: "latest")
- `args`: Arguments to pass to flipt command
- `working-directory`: Directory to run flipt in (default: GITHUB_WORKSPACE)
- `GITHUB_TOKEN`: Required for GitHub API rate limiting

### Version Resolution

The action supports both Flipt v1 and v2 with intelligent version resolution:

| Pattern | Resolves To | Example |
|---------|-------------|---------|
| `latest` | Latest v1 release (backward compatible) | `latest` |
| `v1`, `latest-v1` | Latest v1.x release | `v1` |
| `v2`, `latest-v2` | Latest v2.x release | `v2` |
| `vX.Y.Z` | Specific version | `v1.47.0`, `v2.0.0` |

**Implementation Details:**
- `resolveVersion()` function in `src/lib/cli.ts` handles pattern matching
- `getLatestVersionByMajor()` filters GitHub releases by major version prefix
- Maintains backward compatibility by defaulting `latest` to v1
- Supports both database-backed (v1) and Git-native (v2) Flipt variants

## Important Notes

- The action runs on Node.js 20 runtime
- Always run `npm run all` before pushing to ensure code passes all checks
- The dist/ folder must be committed as it contains the bundled action code
- Test files use Jest with ts-jest for TypeScript support