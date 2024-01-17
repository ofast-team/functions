import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { db } from './util'
import { getDoc, doc } from 'firebase/firestore'

export function getUserData(req: Request, res: Response) {
  const userId: string = req.body.uid
  admin
    .auth()
    .getUser(userId)
    .then((curUser) => {
      let data = {
        email: curUser.email,
        username: curUser.displayName,
      }

      getDoc(doc(db, 'UserData', userId))
        .then((doc) => {
          if (doc.exists()) {
            data = { ...data, ...doc.data() }
            return res.status(200).json(data)
          } else {
            return res.status(404).json({ general: 'User Data Not Found' })
          }
        })
        .catch((err) => {
          return res.status(500).json({ error: err.code })
        })
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code })
    })
}
