import * as core from '@actions/core'
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
  core.info('flipt installed successfully')
  core.endGroup()

  if (!args || args.length === 0) {
    core.info('flipt command not provided, skipping')
    return
  }

  let workspace = core.getInput('working-directory')

  if (!workspace || workspace.length === 0) {
    workspace = environmentVariables.GITHUB_WORKSPACE
  }

  core.debug(`running flipt in workspace: ${workspace}`)

  core.startGroup('Running flipt')

  const result = await exec('flipt', [...args])

  core.endGroup()

  if (!result.success) {
    core.setFailed(`flipt command failed: ${result.stderr}`)
    return
  }
}

run()
