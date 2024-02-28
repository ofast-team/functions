import type { ProblemData } from './ProblemData'
import { Request, Response } from 'express'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './util'

export async function updateProblemData(req: Request, res: Response) {
  try {
    const problemData: ProblemData[] = req.body.problemData
    await Promise.all(
      problemData.map((data) =>
        updateDoc(doc(db, 'ProblemData', data.problemID), data),
      ),
    )
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update problem data' })
  }

  return res.status(200).json({ status: 'Successfully updated problem data' })
}
