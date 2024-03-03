import { Request, Response } from 'express'
import { db } from './util'
import { doc, getDoc } from 'firebase/firestore'

// UNTESTED
export function getProblemData(req: Request, res: Response) {
  const problemID: string = req.body.problemID
  const data = getDoc(doc(db, 'ProblemData', problemID))
  return res.status(200).json(data)
}
