import type { Problem } from './Problem'
import { Request, Response } from 'express'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './util'

export async function updateProblems(req: Request, res: Response) {
  try {
    const problems: Problem[] = req.body
    await Promise.all(
      problems.map((problem) =>
        setDoc(doc(db, 'Problems', problem.problemID), problem, {
          merge: true,
        }),
      ),
    )
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update problem' })
  }

  return res.status(200).json({ status: 'Successfully updated all problems' })
}
