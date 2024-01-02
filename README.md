# Flipt Setup Action

![GitHub Release](https://img.shields.io/github/v/release/flipt-io/setup-action)

This action installs [Flipt](https://flipt.io) in your GitHub Actions workflow. You can pass additional arguments to the `flipt` command using the `args` input. If no arguments are provided, `flipt` will be installed and run with the `--help` flag.

## Example

## Usage

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    # Checkout the target repository
    - uses: actions/checkout@v3

    - uses: flipt-io/setup-action@v0.0.1
      # with:
        # Optional, additional arguments to pass to the `flipt` command
        # args:
        # Optional, the version of Flipt to install, defaults to the latest release
        # version:
        # Optional, the directory to run Flipt against, defaults to the repository root
        # working-directory:
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
