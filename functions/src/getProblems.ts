import admin from 'firebase-admin'
import { Request, Response } from 'express'
import type { Problem } from './Problem'

// UNTESTED
export function getProblems(_req: Request, res: Response) {
  const db = admin.firestore()
  db.collection('Problems')
    .get()
    .then((querySnapshot) => {
      const problems: Problem[] = []
      querySnapshot.forEach((doc) => {
        problems.push(doc.data() as Problem)
      })
      return res.status(200).json(problems)
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code })
    })
}
