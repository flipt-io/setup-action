# Flipt Setup Action

![GitHub Release](https://img.shields.io/github/v/release/flipt-io/setup-action)

This action installs [Flipt](https://flipt.io) in your GitHub Actions workflow.

You can pass additional arguments to the `flipt` command using the `args` input. If no arguments are provided, `flipt` will be installed and run with the `--help` flag.

Any of the [Flipt CLI commands](https://www.flipt.io/docs/cli/overview) can be run using this action.

## Examples

### Validate

Docs: <https://www.flipt.io/docs/cli/commands/validate>

This example installs Flipt and runs `flipt validate` against the repository root.

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.0.1
      # with:
        # Optional, additional arguments to pass to the `flipt` command
        # args:
        # Optional, the version of Flipt to install, defaults to the latest release
        # version:
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:

    - run: flipt validate
```

### OCI Bundle and Push

Docs: <https://www.flipt.io/docs/cli/commands/bundle/build>

This example installs Flipt and runs `flipt bundle build` against the repository root. It then pushes the bundle to a registry with `flipt bundle push`, allowing you to store and share your feature flag data as an OCI artifact.

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.0.1
      # with:
        # Optional, additional arguments to pass to the `flipt` command
        # args:
        # Optional, the version of Flipt to install, defaults to the latest release
        # version:
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:

    - name: Get UUID
        id: uuid
        run: | 
            echo "uuid=$(uuidgen)" >> $GITHUB_OUTPUT
        
    # Build the bundle and push it to an ephemeral registry (available for 1 hour)
    - name: Build and Push bundle
      run: |
        flipt bundle build {{ steps.uuid.outputs.uuid }}:latest ttl.sh/${{ steps.uuid.outputs.uuid }}:1h
        flipt bundle push ttl.sh/${{ steps.uuid.outputs.uuid }}:1h
```

## Customizing

### inputs

Following inputs can be used as `step.with` keys

| Name                | Type   | Description                                                                |
| ------------------- | ------ | -------------------------------------------------------------------------- |
| `working-directory` | string | **Optional**. The directory to validate, defaults to the repository root   |
| `version`           | string | **Optional**. The version of Flipt to install, defaults to the latest release. |
| `args`              | string | **Optional**. Additional arguments to pass to the `flipt` command |

## Development

```console
# Builds the typescript code.
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
