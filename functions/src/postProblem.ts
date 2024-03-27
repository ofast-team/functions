import { Octokit } from '@octokit/rest'
import { Request, Response } from 'express'
import { createOAuthAppAuth } from '@octokit/auth-oauth-app'
import type { Problem } from './Problem'
import { GITHUB_TOKEN } from './githubToken'

export async function postProblem(req: Request, res: Response) {
  const clientId = '5c6aac2d2c170f80bd69'
  const githubToken = GITHUB_TOKEN.value
  const octokit = new Octokit({
    authStrategy: createOAuthAppAuth,
    auth: { clientId, clientSecret: githubToken },
  })
  const owner = 'ofast-team'
  const repo = 'problems'
  try {
    const problem: Problem = req.body
    const content = JSON.stringify(problem, null, 2)

    const branchName = `problem-${problem.problemID}`
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${problem}`,
      sha: 'main',
    })

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `problems/${problem.problemID}.json`,
      message: 'Create problem file',
      content: Buffer.from(content).toString('base64'),
      branch: branchName,
    })

    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title: 'Automated Pull Request for Problem',
      head: branchName,
      base: 'main',
      body: `Automated Pull Request for Problem #${problem.problemID}`,
    })

    return res
      .status(200)
      .send('Problem created successfully: ' + response.data.html_url)
  } catch (error) {
    return res.status(500).send('Error creating Pull Request: ' + error)
  }
}
