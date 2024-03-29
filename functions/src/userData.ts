import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { db } from './util'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

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

export function updateUserData(req: Request, res: Response) {
  const userData = req.body
  const userId: string = userData.uid

  const email = Object.prototype.hasOwnProperty.call(userData, 'email')
    ? { email: userData.email }
    : {}
  const username = Object.prototype.hasOwnProperty.call(userData, 'username')
    ? { displayName: userData.username }
    : {}
  const name = Object.prototype.hasOwnProperty.call(userData, 'name')
    ? { name: userData.name }
    : {}
  const school = Object.prototype.hasOwnProperty.call(userData, 'school')
    ? { school: userData.school }
    : {}

  admin
    .auth()
    .updateUser(userId, email)
    .then(() => {
      let resJson = { email: 'Not Updated' }
      if (Object.prototype.hasOwnProperty.call(email, 'email'))
        resJson = { email: 'Success' }
      return resJson
    })
    .catch((err) => {
      let resJson = {}
      if (err.code === 'auth/email-already-exists')
        resJson = { email: 'Email in Use' }
      else if (err.code === 'auth/invalid-email')
        resJson = { email: 'Invalid Email' }
      else resJson = { email: 'Internal Server Error' }
      return resJson
    })
    .then((resJson) => {
      admin
        .auth()
        .updateUser(userId, username)
        .then(() => {
          if (Object.prototype.hasOwnProperty.call(username, 'displayName'))
            resJson = { ...resJson, username: 'Success' }
          else resJson = { ...resJson, username: 'Not Updated' }
          return resJson
        })
        .catch(() => {
          resJson = { ...resJson, username: 'Internal Server Error' }
          return resJson
        })
        .then((resJson) => {
          updateDoc(doc(db, 'UserData', userId), name)
            .then(() => {
              if (Object.prototype.hasOwnProperty.call(name, 'name'))
                resJson = { ...resJson, name: 'Success' }
              else resJson = { ...resJson, name: 'Not Updated' }
              return resJson
            })
            .catch(() => {
              resJson = { ...resJson, name: 'Internal Server Error' }
              return resJson
            })
            .then((resJson) => {
              updateDoc(doc(db, 'UserData', userId), school)
                .then(() => {
                  if (Object.prototype.hasOwnProperty.call(school, 'school'))
                    resJson = { ...resJson, school: 'Success' }
                  else resJson = { ...resJson, school: 'Not Updated' }
                  return res.status(207).json(resJson)
                })
                .catch(() => {
                  resJson = { ...resJson, school: 'Internal Server Error' }
                  return res.status(207).json(resJson)
                })
            })
            .catch((err) => {
              return res.status(400).json({ error: err.code })
            })
        })
        .catch((err) => {
          return res.status(400).json({ error: err.code })
        })
    })
    .catch((err) => {
      return res.status(400).json({ error: err.code })
    })
}
