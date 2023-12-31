import { https } from 'firebase-functions'
import admin from 'firebase-admin'

import express, { Express, Request, Response } from 'express'
const app: Express = express()

admin.initializeApp()

const firebaseConfig = {
  apiKey: 'AIzaSyD1yV--rl-qJiyvwju2K9jz_jkhvr8sTHw',
  authDomain: 'ofast-e6866.firebaseapp.com',
  projectId: 'ofast-e6866',
  storageBucket: 'ofast-e6866.appspot.com',
  messagingSenderId: '660869453090',
  appId: '1:660869453090:web:b919fe7e93c35a77a5417b',
  measurementId: 'G-3B0LRWZFH5',
}

import cors from 'cors'

const allowedOriginsList = [
  'http://localhost:3000',
  'https://ofast.io',
  'https://ofast-e6866.web.app',
  'https://ofast-e6866.firebaseapp.com',
]

const allowedMethodsList = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']

const allowedHeadersList = [
  'Origin',
  'X-Requested-With',
  'Content-Type',
  'Accept',
  'Authorization',
]

app.use(
  cors({
    origin: allowedOriginsList,
    methods: allowedMethodsList,
    allowedHeaders: allowedHeadersList,
  }),
)

import { initializeApp } from 'firebase/app'
initializeApp(firebaseConfig)

/**
 * Test API
 *
 * @res Hello World!
 */
app.post('/helloWorld', (req: Request, res: Response) => {
  console.log('Hello!')
  res.json({ str: 'Hello World!' })
})

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'

const auth = getAuth()

/**
 * API for logging in via an email and password
 *
 * @req JSON containing "email" and "password" fields
 * @res Stores the status of the request and a json containing either
 *      the "userID" field if the request was valid, the "error" field
 *      if the API crashed, or the "general" field if the request was
 *      invalid. The following may be stored in the general field:
 *          - Invalid Credentials: Email or Password was incorrect
 *          - Invalid Email: The provided email is improperly formatted
 *          - Missing Email: No email field was provided
 *          - Missing Password: No password field was provided
 */
app.post('/loginWithEmail', (req: Request, res: Response) => {
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
})

/**
 * API for registering via an email and password
 *
 * @req JSON containing "email" and "password" fields
 * @res Stores the status of the request and a json containing either
 *      the "error" field if the API crashed, or the "general" field
 *      The following may be stored in the general field:
 *          - User Created: The request was valid and a user was created
 *          - Email in Use: The email provided is already tied to an account
 *          - Invalid Email: The provided email is improperly formatted
 *          - Missing Email: No email field was provided
 *          - Missing Password: No password field was provided
 */
app.post('/registerWithEmail', (req: Request, res: Response) => {
  const newUser = req.body
  createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
    .then(() => {
      return res.status(201).json({ general: 'User Created' })
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
})

exports.api = https.onRequest(app)
