import { https } from 'firebase-functions'
import admin from 'firebase-admin'

import express, { Express, Request, Response } from 'express'
const app: Express = express()

admin.initializeApp()

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

/**
 * Test API
 *
 * @res Hello World!
 */
app.post('/helloWorld', (req: Request, res: Response) => {
  console.log('Hello!')
  res.json({ str: 'Hello World!' })
})

import { emailLogin, emailRegister } from './user'
import { getUserData, updateUserData } from './userData'
import { get_verdict_final, get_verdict_list, judgeIsOnline, submit } from './judge'

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
app.post('/loginWithEmail', emailLogin)

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
app.post('/registerWithEmail', emailRegister)

/**
 * API for retrieving user data
 *
 * @req JSON containing "uid" field which is the unique identifier for the user
 * @res Stores the status of the request and a json containing either
 *      the "error" field if the API crashed, the "general" field, or the user data
 *      The following may be stored in the general field:
 *          - User Data not Found: Usually means that this user was created before
 *                                 the new database was created for user data
 *      User data fields may include:
 *          - email
 *          - username
 *          - name
 *          - problemsAttempted
 *          - problemsAccepted
 *          - problemsRTE
 *          - problemsTLE
 *          - ProblemsWrong
 */
app.post('/getUserData', getUserData)

/**
 * API for retrieving user data
 *
 * @req JSON containing "uid" field which is the unique identifier for the user and
 *      any field that is being updated from the following list
 *          - email
 *          - username
 *          - name
 *          - school
 * @res Stores the status of the request and a field for each of the four possible
 *      updates listed above. Each field will state:
 *          - "No update": This field did not get updated
 *          - "Success": The update was successful
 *          - "Internal Server Error": Something crashed
 *      The email field can also have the following messages:
 *          - "Email in Use": That email is used by another account already
 *          - "Invalid Email": The email provided is not formatted correctly
 */
app.post('/updateUserData', updateUserData)

/**
 * API for marking the judge as online.
 * @req empty JSON
 * @res JSON containing the field time denoting whether the time was updated
 */
app.get('/judgeIsOnline', judgeIsOnline)

/**
 * API for marking the judge as online.
 * @req empty JSON
 * @res JSON containing the field time denoting whether the time was updated
 */
app.post('/submit', submit)

/**
 * API for marking the judge as online.
 * @req empty JSON
 * @res JSON containing the field time denoting whether the time was updated
 */
app.post('/getVerdictList', get_verdict_list)

/**
 * API for marking the judge as online.
 * @req empty JSON
 * @res JSON containing the field time denoting whether the time was updated
 */
app.post('/getVerdictFinal', get_verdict_final)

exports.api = https.onRequest(app)
