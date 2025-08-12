import * as core from '@actions/core'
import * as path from 'path'
import {downloadFlipt} from './lib/cli'
import {environmentVariables} from './lib/environment'
import {exec} from './lib/exec'

async function run(): Promise<void> {
  try {
    const argsInput = core.getInput('args')

    // split args by whitespace
    const args = argsInput
      .trim()
      .split(/\s+/)
      .filter(arg => arg !== '')
      .filter(arg => arg.length > 0)

    await flipt(args)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function flipt(args: string[] = []): Promise<void> {
  let version = core.getInput('version')

  core.startGroup(`Installing flipt:${version}`)
  await downloadFlipt(version)
  core.endGroup()

  core.info('flipt installed successfully')

  if (!args || args.length === 0) {
    core.info('flipt command not provided, skipping')
    return
  }

  // Check if this is a validate command and register problem matcher
  const isValidateCommand = args.includes('validate')
  if (isValidateCommand) {
    await registerFliptProblemMatcher()

    // Auto-append --format json if not already present
    if (!args.includes('--format') && !args.includes('-F')) {
      args.push('--format', 'json')
      core.debug(
        'Auto-appended --format json to validate command for problem matcher parsing'
      )
    }
  }

  let workspace = core.getInput('working-directory')

  if (!workspace || workspace.length === 0) {
    workspace = environmentVariables.GITHUB_WORKSPACE
  }

  core.debug(`running flipt in workspace: ${workspace}`)

  core.startGroup('Running flipt')

  const result = await exec('flipt', [...args], {
    cwd: workspace
  })

  core.endGroup()

  if (!result.success) {
    core.setFailed(`flipt command failed: ${result.stderr}`)
    return
  }
}

async function registerFliptProblemMatcher(): Promise<void> {
  try {
    // The problem matcher file is located relative to the action root
    const matcherPath = path.join(
      __dirname,
      '..',
      '.github',
      'flipt-problem-matcher.json'
    )
    core.debug(`Registering problem matcher from: ${matcherPath}`)

    // Register the problem matcher
    console.log(`::add-matcher::${matcherPath}`)

    core.info('Registered Flipt problem matcher for validation errors')
  } catch (error) {
    core.warning(`Failed to register Flipt problem matcher: ${error}`)
  }
}

run()
