import * as os from "os";
import * as core from "@actions/core";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import { exec } from "./exec";
import path from "path";
import fetch from "node-fetch";
import { Octokit } from "@octokit/rest";
import { createActionAuth } from "@octokit/auth-action";

interface ResolvedVersion {
  tag: string;
  isLatest: boolean;
}

function getPlatform(): string | undefined {
  const platforms = {
    "linux-x64": "linux_x86_64",
    'linux-arm64': 'linux_arm64',
    'darwin-x64': 'darwin_x86_64',
    'darwin-arm64': 'darwin_arm64',
    // 'win32-x64': 'windows-x64'
  };

  const runnerPlatform = os.platform();
  const runnerArch = os.arch();

  return platforms[`${runnerPlatform}-${runnerArch}` as keyof typeof platforms];
}

async function resolveVersion(version: string, octokit: Octokit): Promise<ResolvedVersion> {
  // Handle specific version tags (e.g., v1.47.0, v2.0.0)
  if (version.match(/^v\d+\.\d+\.\d+/)) {
    return { tag: version, isLatest: false };
  }

  // Handle version resolution patterns
  switch (version) {
    case "latest":
    case "v1":
    case "latest-v1":
      return await getLatestVersionByMajor(1, octokit);
    
    case "v2":
    case "latest-v2":
      return await getLatestVersionByMajor(2, octokit);
    
    default:
      // Fallback to existing behavior for unknown patterns
      return { tag: version, isLatest: false };
  }
}

async function getLatestVersionByMajor(majorVersion: number, octokit: Octokit): Promise<ResolvedVersion> {
  try {
    // List all releases to filter by major version
    const releases = await octokit.rest.repos.listReleases({
      owner: "flipt-io",
      repo: "flipt",
      per_page: 100 // Get more releases to ensure we find the latest
    });

    // Filter releases by major version and find the latest
    const filteredReleases = releases.data
      .filter(release => !release.prerelease && !release.draft) // Exclude prereleases and drafts
      .filter(release => new RegExp(`^v${majorVersion}\\.\\d+\\.\\d+$`).test(release.tag_name))
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());

    if (filteredReleases.length === 0) {
      throw new Error(`No stable releases found for v${majorVersion}.x`);
    }

    const latestRelease = filteredReleases[0];
    core.debug(`Latest v${majorVersion} release is ${latestRelease.tag_name}`);
    
    return { tag: latestRelease.tag_name, isLatest: true };
  } catch (error) {
    throw new Error(`Failed to find latest v${majorVersion} release: ${error}`);
  }
}

export async function downloadFlipt(version: string): Promise<void> {
  let octokit = new Octokit({
    authStrategy: createActionAuth,
    request: { fetch: fetch },
  });

  const platform = getPlatform();
  if (!platform) {
    throw new Error("Unsupported platform");
  }

  let downloadUrl: string | undefined;

  try {
    // Resolve the version pattern to an actual release tag
    const resolvedVersion = await resolveVersion(version, octokit);
    const releaseTag = resolvedVersion.tag;

    core.debug(`Resolved version '${version}' to release tag '${releaseTag}'`);

    let release;
    if (resolvedVersion.isLatest) {
      // For latest resolutions, we already have the release info from getLatestVersionByMajor
      // But we still need to get the full release data for assets
      release = await octokit.rest.repos.getReleaseByTag({
        owner: "flipt-io",
        repo: "flipt",
        tag: releaseTag,
      });
    } else {
      // For specific versions, get the release by tag
      release = await octokit.rest.repos.getReleaseByTag({
        owner: "flipt-io",
        repo: "flipt",
        tag: releaseTag,
      });
    }

    if (!release) {
      throw new Error(`No release found for tag ${releaseTag}`);
    }

    core.debug(`Using flipt release ${releaseTag}`);

    const asset = release.data.assets.find(
      (asset: { name: string }) => asset.name === `flipt_${platform}.tar.gz`
    );

    downloadUrl = asset?.browser_download_url;

    if (!downloadUrl) {
      throw new Error(
        `No download url found for ${platform}: version ${releaseTag}`
      );
    }

    core.debug(`Downloading from ${downloadUrl}`);

    const destination = path.join(os.homedir(), ".flipt/flipt");
    core.debug(`Install destination is ${destination}`);

    await io
      .rmRF(destination)
      .catch()
      .then(() => {
        core.debug(
          `Successfully deleted pre-existing ${destination} directory (if any)}`
        );
      });

    const downloaded = await tc.downloadTool(downloadUrl);

    core.debug(`Successfully downloaded 'flipt-${releaseTag}' to ${downloaded}`);

    await io.mkdirP(destination);
    const extractedPath = await tc.extractTar(downloaded, destination);
    core.debug(`Successfully extracted ${downloaded} to ${extractedPath}`);

    const cachedPath = await tc.cacheDir(destination, "flipt", releaseTag);

    core.addPath(cachedPath);
    core.debug(`Successfully cached ${destination} to ${cachedPath}`);

    const versionExec = await exec("flipt", ["--version"], {silent: true});
    if (!versionExec.success) {
      throw new Error(`flipt failed to run: ${versionExec.stderr.trim()}`);
    }

    core.info(`${versionExec.stdout.trim()}`);
  } catch (error) {
    throw new Error(`Failed to release: ${error}`);
  }
}
