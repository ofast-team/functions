import { Request, Response } from 'express'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth, db } from './util'

import { doc, setDoc } from 'firebase/firestore'

export function emailLogin(req: Request, res: Response): void {
  const user = req.body
  signInWithEmailAndPassword(auth, user.email, user.password)
    .then((data) => {
      return res.status(200).json({ userID: data.user.uid })
    })
    .catch((err) => {
      if (err.code === 'auth/invalid-login-credentials')
        return res.status(401).json({ general: 'Invalid Credentials' })
      else if (err.code === 'auth/invalid-email')
        return res.status(401).json({ general: 'Invalid Email' })
      else if (err.code === 'auth/missing-email')
        return res.status(401).json({ general: 'Missing Email' })
      else if (err.code === 'auth/missing-password')
        return res.status(401).json({ general: 'Missing Password' })
      else return res.status(500).json({ error: err.code })
    })
}

export function emailRegister(req: Request, res: Response): void {
  const newUser = req.body
  createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
    .then((data) => {
      setDoc(doc(db, 'UserData', data.user.uid), {})
        .then(() => {
          return res.status(201).json({ general: 'User Created' })
        })
        .catch((err) => {
          return res.status(500).json({ error: err })
        })
    })
    .catch((err) => {
      if (err.code === 'auth/email-already-in-use')
        return res.status(401).json({ general: 'Email in Use' })
      else if (err.code === 'auth/invalid-email')
        return res.status(401).json({ general: 'Invalid Email' })
      else if (err.code === 'auth/missing-email')
        return res.status(401).json({ general: 'Missing Email' })
      else if (err.code === 'auth/missing-password')
        return res.status(401).json({ general: 'Missing Password' })
      else return res.status(500).json({ error: err.code })
    })
}
