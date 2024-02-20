import { Request, Response } from 'express'
import { Octokit } from '@octokit/rest'
import { createOAuthAppAuth } from '@octokit/auth-oauth-app'
import type { Problem } from './Problem'
import * as path from 'path'
import { GITHUB_TOKEN } from './githubToken'

export async function getProblems(_req: Request, res: Response) {
  const clientId = '5c6aac2d2c170f80bd69'
  const githubToken = GITHUB_TOKEN.value() // rename the token
  const auth = createOAuthAppAuth({ clientId, clientSecret: githubToken })
  const octokit = new Octokit({
    authStrategy: auth,
    auth: { clientId, clientSecret: githubToken },
  })
  const owner = 'ofast-team'
  const repo = 'problems'
  try {
    // Get a list of all files and directories in the root directory of the repository
    const { data: filesAndDirs } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    })

    // Filter out only directories (excluding files)
    const subdirectories = (filesAndDirs as { type: string; name: string }[])
      .filter((item: { type: string }) => item.type === 'dir')
      .map((item: { name: string }) => item.name as string)

    // Initialize an array to store file contents
    const fileContentsArray: Problem[] = []

    // Iterate through each subdirectory
    for (const directory of subdirectories) {
      const problemJsonPath = path.join(directory, 'problem.json')

      try {
        // Read the contents of the 'problem.json' file
        const { data: problemJsonFile } = await octokit.repos.getContent({
          owner,
          repo,
          path: problemJsonPath,
        })

        // Decode the content from base64
        const problemJsonContent: string = Buffer.from(
          ((problemJsonFile as { content: string }).content as string) || '',
          'base64',
        ).toString('utf-8')

        // Parse the JSON content and add it to the array
        const parsedContent: Problem = JSON.parse(problemJsonContent)
        fileContentsArray.push(parsedContent)
      } catch (error) {
        return res.status(500).json({
          error:
            `Error reading or parsing 'problem.json' in ${directory}:` +
            (error as { message: string }).message,
        })
      }
    }

    return res.status(200).json(fileContentsArray)
  } catch (error) {
    return res.status(500).json({
      error:
        'Error fetching directories:' + (error as { message: string }).message,
    })
  }
}
