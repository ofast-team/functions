import { Request, Response } from 'express'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './util'
export async function getSubmissions(req: Request, res: Response) {
  const uId = req.body.uid
  const pIds: string[] = req.body.problemIds
  const isBrief = req.body.isBrief
  try {
    let allSubmissions: object[] = []

    const add = (submission: object) => {
      return new Promise((resolve, reject) => {
        if (submission !== null) {
          allSubmissions.push(submission)
          resolve(allSubmissions)
        } else {
          reject(new Error('invalid'))
        }
      })
    }

    await Promise.all(
      pIds.map(async (pId) => {
        let submissionList: object[] = []
        const submDb = collection(db, 'Submissions')
        console.log(uId + ' ' + pId)
        const queries = query(
          submDb,
          where('problem_id', '==', pId),
          where('uid', '==', uId),
        )

        const docs = await getDocs(queries)
        docs.forEach((doc) => submissionList.push(doc.data()))

        let problem = {}
        if (isBrief) {
          let isSubmitted = submissionList.length > 0
          let isACed = false
          submissionList.forEach((submission) => {
            let submissionJson = JSON.parse(JSON.stringify(submission))
            if (submissionJson.verdict == 3) isACed = true
          })
          problem = {
            problemId: pId,
            isSubmitted: isSubmitted,
            isAccepted: isACed,
          }
        } else {
          problem = {
            problemId: pId,
            submissions: submissionList,
          }
        }
        console.log(problem)
        await add(problem)
      }),
    )
    res.status(200).json({ submissionsPerProblem: allSubmissions })
  } catch (err) {
    res.status(500).json({ error: err })
  }
}
