import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  throw new Error("PERSONAL_ACCESS_TOKEN (or GITHUB_TOKEN) is not defined");
}

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
export const GITHUB_REPO = process.env.GITHUB_REPO || "";
