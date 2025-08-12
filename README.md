# Flipt Setup Action

![GitHub Release](https://img.shields.io/github/v/release/flipt-io/setup-action)

This action installs [Flipt](https://flipt.io) in your GitHub Actions workflow, supporting both Flipt v1 and v2.

You can pass additional arguments to the `flipt` command using the `args` input. If no arguments are provided, `flipt` will be installed and run with the `--help` flag.

Both Flipt v1 and v2 CLI commands can be run using this action. The version you install determines which commands are available.

## Supported Platforms

- Linux x86_64
- Linux arm64
- MacOS x86_64
- MacOS arm64

## Version Selection

This action supports both Flipt v1 and v2. Choose your version based on your needs:

- **Flipt v1**: Traditional database-backed feature flag management
  - Docs: <https://docs.flipt.io/>
- **Flipt v2**: Git-native feature flag management with declarative APIs
  - Docs: <https://docs.flipt.io/v2>

### Version Resolution

The `version` input supports several patterns:

| Pattern     | Description                                             | Example             |
| ----------- | ------------------------------------------------------- | ------------------- |
| `latest`    | Latest v1 release (default, for backward compatibility) | `latest`            |
| `v1`        | Latest v1 release                                       | `v1`                |
| `latest-v1` | Latest v1 release (explicit)                            | `latest-v1`         |
| `v2`        | Latest v2 release                                       | `v2`                |
| `latest-v2` | Latest v2 release (explicit)                            | `latest-v2`         |
| `vX.Y.Z`    | Specific version                                        | `v1.47.0`, `v2.0.0` |

**Examples:**

```yaml
# Use latest v1 (backward compatible default)
version: latest

# Use latest v1 (explicit)
version: v1

# Use latest v2
version: v2

# Use specific versions
version: v1.47.0
version: v2.0.0
```

## Examples for Flipt v1

### Validate (v1)

Docs: <https://www.flipt.io/docs/cli/commands/validate>

This example installs Flipt v1 and runs `flipt validate` against the repository root.

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.5.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # required to download flipt cli without rate limiting
        version: v1 # Use latest v1 release
        # Optional, additional arguments to pass to the `flipt` command
        # args:
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:

    - run: flipt validate
```

### OCI Bundle and Push (v1)

Docs: <https://www.flipt.io/docs/cli/commands/bundle/build>

This example installs Flipt v1 and runs `flipt bundle build` against the repository root. It then pushes the bundle to a registry with `flipt bundle push`, allowing you to store and share your feature flag data as an OCI artifact.

```yaml
bundle:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.5.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # required to download flipt cli without rate limiting
        version: v1 # Use latest v1 release
        # Optional, additional arguments to pass to the `flipt` command
        # args:
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:

    - name: Get UUID
      id: uuid
      run: |
        echo "uuid=$(uuidgen)" >> $GITHUB_OUTPUT

    # Build the bundle and push it to an ephemeral registry (available for 1 hour)
    - name: Build and Push bundle
      run: |
        flipt bundle build -t ttl.sh/${{ steps.uuid.outputs.uuid }}:1h
        flipt bundle push ttl.sh/${{ steps.uuid.outputs.uuid }}:1h
```

### Import/Export (v1)

Docs: <https://www.flipt.io/docs/operations/import-export>

Example of importing and exporting feature flag data:

```yaml
import-export:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.5.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        version: v1

    # Export flags from a running Flipt instance
    - name: Export flags
      run: flipt export --address http://flipt.my.org > flags.yaml

    # Import flags to another instance
    - name: Import flags
      run: flipt import --address http://flipt-staging.my.org < flags.yaml
```

## Examples for Flipt v2

### Validate (v2)

Docs: <https://docs.flipt.io/v2/cli/overview>

Flipt v2 uses the same `validate` command but works with Git-native storage. Note that v2 does not support bundle or import/export operations - flags are managed directly through Git.

```yaml
validate-v2:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.5.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        version: v2 # Use latest v2 release
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:

    - run: flipt validate
```

### Working with Git Storage (v2)

Flipt v2 is Git-native and can work directly with your repository:

```yaml
git-workflow-v2:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.5.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        version: v2.0.0 # Use specific v2 version

    # Validate flag configurations in your Git repository
    - name: Validate flags
      run: flipt validate
```

## Key Differences Between v1 and v2

### Flipt v1

- Database-backed storage (PostgreSQL, MySQL, SQLite)
- Traditional client-server architecture
- Bundle, Import/Export commands for data migration
- Suitable for centralized flag management
- CLI Docs: <https://www.flipt.io/docs/cli/overview>

### Flipt v2

- Git-native storage (flags stored in Git repositories)
- Declarative API approach
- Multi-environment support
- Direct Git integration for flag management
- No bundle/import/export operations (uses Git directly)
- CLI Docs: <https://docs.flipt.io/v2/cli/overview>

For more detailed information:

- [Flipt v1 Documentation](https://docs.flipt.io/)
- [Flipt v2 Documentation](https://docs.flipt.io/v2)
- [v2 Introduction and Differences](https://docs.flipt.io/v2/introduction)

## Customizing

### inputs

The following inputs can be used as `step.with` keys

| Name                | Type   | Description                                                                         |
| ------------------- | ------ | ----------------------------------------------------------------------------------- |
| `working-directory` | string | **Optional**. The directory to validate, defaults to the repository root            |
| `version`           | string | **Optional**. The version of Flipt to install, defaults to the latest (v1) release. |
| `args`              | string | **Optional**. Additional arguments to pass to the `flipt` command                   |
| `GITHUB_TOKEN`      | string | **Required**. The GitHub token to use to download Flipt CLI without rate limiting.  |

## Development

```console
# Builds the TypeScript code.
npm run build

# Runs eslint.
npm run lint

# Runs prettier.
npm run format

# Packages the code into the dist folder. Must be updated to pass CI on `main`.
npm run package

# Runs all of the above commands.
npm run all
```

## License

[Apache 2.0](LICENSE)
