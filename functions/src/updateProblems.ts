import type { Problem } from './Problem'
import { Request, Response } from 'express'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './util'

export async function updateProblems(req: Request, res: Response) {
  try {
    const problems: Problem[] = req.body.problems
    await Promise.all(
      problems.map((problem) =>
        updateDoc(doc(db, 'Problems', problem.problemID), problem),
      ),
    )
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update problem' })
  }

  return res.status(200).json({ status: 'Successfully updated all problems' })
}