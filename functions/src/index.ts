// TODO: make docs consistent, likely by pivoting to doxygen

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
  express.json(),
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

import {
  emailLogin,
  emailRegister,
  isVerified,
  sendVerificationEmail,
  doSendPasswordResetEmail,
} from './user'
import { getUserData, updateUserData } from './userData'
import { updateProblems } from './updateProblems'
import { getProblems } from './getProblems'
import { updateProblemData } from './updateProblemData'
import { getProblemData } from './getProblemData'
import { get_verdict, judge_is_online, submit } from './judge'
import { getSubmissions } from './submissions'

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
app.post('/getProblemData', getProblemData)

/**
 * API for marking the judge as online.
 * @req empty JSON
 * @res JSON containing the field time denoting whether the time was updated
 */
app.get('/judgeIsOnline', judge_is_online)

/**
 * API for making a submission to the judge
 * @req JSON containing the following fields if doing an arbitrary submit:
 *          - uid: the user id for the user who is submitting
 *          - source_code: a base64 encoded string containing the user's code
 *          - language_id: a string containing the file ending of the language
 *          - inputs: an array of base64 encoded strings containing the input for the problem
 *          - outputs: an array of base64 encoded strings containing the expected output for the user program
 * @req JSON containing the following fields if doing a problem submit:
 *          - uid: the user id for the user who is submitting
 *          - source_code: a base64 encoded string containing the user's code
 *          - language_id: a string containing the file ending of the language
 *          - problem_id: a string containing the problem's id
 * @res JSON containing a token that can be used to retrieve the submission (or error upon errors)
 */
app.post('/submit', submit)

/**
 * API for getting the verdict (and other metadata) of a submission
 * @req JSON containing the token for the submission
 * @res JSON containing the following fields:
 *          - date: a date object containing date/time of submission
 *          - problem_id: (-1 by default right now)
 *          - verdict: integer denoting the verdict
 *          - verdict_list: array of integers denoting each test case's result
 *          - passed_cases: integer denoting how many cases were passed
 *          - total_cases: integer denoting how many cases total
 */
app.post('/getVerdict', get_verdict)

/*
 * API for checking if the current user has verified their email
 * @req JSON containing the field "uid" storing the user id
 * @res JSON containing the field "isVerified" storing whether
 *      the user has verified their email (boolean)
 */

app.post('/isVerified', isVerified)

/**
 * API for sending a user a new verification email
 * @req Does not need any parameters
 * @res JSON containing the field "general" storing whether
 *      the user was sent a new verification email or not
 */
app.post('/sendVerificationEmail', sendVerificationEmail)

/**
 * API for sending a user an email for password reset
 * @req JSON containing the fields "isLoggedIn" and "email"
 *          - isLoggedIn stores whether the request was made
 *            from an account already logged in
 *          - email stores the email which needs to be sent
 *            a password reset email. This field should
 *            only be provided for users not logged in
 * @res JSON containing the field "general" storing whether
 *      the user was sent a password reset email or not
 */
app.post('/sendPasswordResetEmail', doSendPasswordResetEmail)
/*
 * API for getting the submissions for each problem in a given list of problems
 * @req JSON with the user id, the list of problemIds needed, and isBrief which
 *      denotes whether the entire submissions is being queried for.
 * @res A JSON file which will return a list of objects. Each of these objects
 *      will have the field "problemId" which will be the problem identifier and
 *      other parameters depending on the isBrief input parameter
 *          - if isBrief is true, two addition parameters will be returned:
 *            isSubmitted, which states whether the user has submitted on the
 *            problem and isAccepted, which states whether the user has ACed on
 *            the problem
 *          - if isBrief is false, one additional parameter will be retuned:
 *            "allSubmissions" which returns a list of all submission objects
 *            for the current problem. Refer to the getVerdict for all information
 *            contained in this object
 */
app.post('/getSubmissions', getSubmissions)

import { postProblem } from './postProblem'

/*
 * API for posting a problem to the problems repository
 * @req JSON containing the problem object
 * @res JSON containing the status of the request
 */
app.post('/postProblem', postProblem)

exports.api = https.onRequest(app)
