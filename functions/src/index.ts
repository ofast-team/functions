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
import { updateProblems } from './updateProblems'
import { getProblems } from './getProblems'
import { updateProblemData } from './updateProblemData'
import { getProblemData } from './getProblemData'

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
app.get('/getUserData', getUserData)

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
 * API for updateing all problems in the database
 *
 * @req List of problems to update
 *
 * @res Status of the request
 */
app.post('/updateProblems', updateProblems)

/**
 * API for getting all problems in the database
 *
 * @req None
 *
 * @res List of all problems in the database
 */
app.get('/getProblems', getProblems)

// TODO: make docs consistent, likely by pivoting to doxygen

/**
 * API for setting a list of problem's data in the database
 *
 * @req JSON body of the form
 * {
 *   "problemID": string
 *   "data": {
 *     input: string // the input data file as a string
 *     output: string // the output data file as a string
 *    }[]
 * }
 *
 * @res Status of the request
 */
app.post('/updateProblemData', updateProblemData)

/**
 * API for getting a problem's data from the database
 *
 * @req JSON body containing the problemID
 * {
 *   "problemID": string
 * }
 *
 * @res The problem's data in the form
 * {
 *   "problemID": string
 *   "data": {
 *     input: string // the input data file as a string
 *     output: string // the output data file as a string
 *    }[]
 * }
 */
app.get('/getProblemData', getProblemData)

exports.api = https.onRequest(app)
