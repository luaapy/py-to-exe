import { uploadFileToGithub, getLatestWorkflowRun } from '@/app/actions/github';
import { octokit } from '@/lib/github-client';

jest.mock('@/lib/github-client', () => {
  const mOctokit = {
    rest: {
      repos: {
        getContent: jest.fn(),
        createOrUpdateFileContents: jest.fn(),
      },
      actions: {
        listWorkflowRuns: jest.fn(),
        getWorkflowRun: jest.fn(),
        listWorkflowRunArtifacts: jest.fn(),
        downloadArtifact: jest.fn(),
      },
    },
  };
  return {
    octokit: mOctokit,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
  };
});

describe('GitHub Server Actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFileToGithub', () => {
    it('should upload a file and return commit sha', async () => {
      (octokit.rest.repos.getContent as jest.Mock).mockRejectedValue(new Error('Not found'));
      (octokit.rest.repos.createOrUpdateFileContents as jest.Mock).mockResolvedValue({
        data: {
          commit: { sha: 'commit-sha-123' },
          content: { path: 'uploaded-files/test.txt' },
        },
      });

      const result = await uploadFileToGithub('base64content', 'test.txt');

      expect(octokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'uploaded-files/test.txt',
      });
      expect(octokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'uploaded-files/test.txt',
        message: 'Upload file for conversion: test.txt',
        content: 'base64content',
        sha: undefined,
      });
      expect(result).toEqual({ commitSha: 'commit-sha-123', path: 'uploaded-files/test.txt' });
    });

    it('should throw error for invalid file type', async () => {
        await expect(uploadFileToGithub('base64content', 'test.exe'))
            .rejects
            .toThrow("File type .exe not allowed");
    });
  });

  describe('getLatestWorkflowRun', () => {
    it('should return the latest run if commitSha is not provided', async () => {
      (octokit.rest.actions.listWorkflowRuns as jest.Mock).mockResolvedValue({
        data: {
          workflow_runs: [
            { id: 123, status: 'completed', conclusion: 'success', head_sha: 'sha1' },
            { id: 122, status: 'completed', conclusion: 'failure', head_sha: 'sha2' },
          ],
        },
      });

      const result = await getLatestWorkflowRun('convert.yml');

      expect(octokit.rest.actions.listWorkflowRuns).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        workflow_id: 'convert.yml',
        per_page: 5,
      });
      expect(result).toEqual({ runId: 123, status: 'completed', conclusion: 'success' });
    });

    it('should return specific run if commitSha is provided', async () => {
      (octokit.rest.actions.listWorkflowRuns as jest.Mock).mockResolvedValue({
        data: {
          workflow_runs: [
            { id: 123, status: 'completed', conclusion: 'success', head_sha: 'sha1' },
            { id: 122, status: 'completed', conclusion: 'failure', head_sha: 'sha2' },
          ],
        },
      });

      // Pass matching SHA
      const result = await getLatestWorkflowRun('convert.yml', 'sha2');

      expect(result).toEqual({ runId: 122, status: 'completed', conclusion: 'failure' });
    });

    it('should return null if commitSha is provided but not found', async () => {
      (octokit.rest.actions.listWorkflowRuns as jest.Mock).mockResolvedValue({
        data: {
          workflow_runs: [
            { id: 123, status: 'completed', conclusion: 'success', head_sha: 'sha1' },
          ],
        },
      });

      const result = await getLatestWorkflowRun('convert.yml', 'sha-not-found');

      expect(result).toBeNull();
    });
  });
});
