'use server'

import { octokit, GITHUB_OWNER, GITHUB_REPO } from '@/lib/github-client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.py', '.lua', '.txt', '.md', '.json'];

function sanitizeFileName(fileName: string): string {
  // Remove any path traversal characters and keep only safe characters
  const name = fileName.replace(/^.*[\\\/]/, ''); // remove directory paths
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadFileToGithub(fileContentBase64: string, fileName: string) {
  try {
    // Validate file size (approximate from base64 length)
    const sizeInBytes = (fileContentBase64.length * 3) / 4 - (fileContentBase64.indexOf('=') > 0 ? (fileContentBase64.length - fileContentBase64.indexOf('=')) : 0);
    if (sizeInBytes > MAX_FILE_SIZE) {
        throw new Error("File too large");
    }

    const sanitizedFileName = sanitizeFileName(fileName);
    const ext = "." + sanitizedFileName.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File type ${ext} not allowed`);
    }

    const path = `uploaded-files/${sanitizedFileName}`;
    const message = `Upload file for conversion: ${sanitizedFileName}`;

    // Check if file exists to get SHA for update (though usually we want a new file or overwrite)
    let sha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
      });
      // Verify if data is a file object (not a directory listing)
      if (!Array.isArray(data) && 'sha' in data) {
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist, which is fine
    }

    const { data: commit } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      message,
      content: fileContentBase64,
      sha,
    });

    return {
      commitSha: commit.commit.sha,
      path: commit.content?.path,
    };
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("File type") || error.message === "File too large")) {
        throw error;
    }
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file to GitHub");
  }
}

export async function getLatestWorkflowRun(workflowFileName: string, commitSha?: string) {
  try {
    const { data } = await octokit.rest.actions.listWorkflowRuns({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      workflow_id: workflowFileName,
      per_page: 5, // Get top 5 to be safe
    });

    let run;
    if (commitSha) {
      run = data.workflow_runs.find(r => r.head_sha === commitSha);
      // If looking for a specific commit and not found, return null so client can retry
      if (!run) return null;
    } else {
      run = data.workflow_runs[0];
    }

    if (!run) {
      return null;
    }

    return {
      runId: run.id,
      status: run.status,
      conclusion: run.conclusion,
    };
  } catch (error) {
    console.error("Error getting latest workflow run:", error);
    throw new Error("Failed to get latest workflow run");
  }
}

export async function checkWorkflowStatus(runId: number) {
  try {
    const { data } = await octokit.rest.actions.getWorkflowRun({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      run_id: runId,
    });

    return {
      status: data.status,
      conclusion: data.conclusion,
    };
  } catch (error) {
    console.error("Error checking workflow status:", error);
    throw new Error("Failed to check workflow status");
  }
}

export async function getWorkflowArtifacts(runId: number) {
  try {
    const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      run_id: runId,
    });

    return data.artifacts.map(artifact => ({
      id: artifact.id,
      name: artifact.name,
    }));
  } catch (error) {
    console.error("Error getting workflow artifacts:", error);
    throw new Error("Failed to get workflow artifacts");
  }
}

export async function getArtifactDownloadUrl(artifactId: number) {
  try {
    const { data } = await octokit.rest.actions.downloadArtifact({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      artifact_id: artifactId,
      archive_format: 'zip',
    });

    // data is ArrayBuffer because downloadArtifact returns it for 'zip' format usually
    // We need to convert it to base64 to send to client
    const buffer = Buffer.from(data as ArrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error("Error getting artifact download URL:", error);
    throw new Error("Failed to get artifact download URL");
  }
}
