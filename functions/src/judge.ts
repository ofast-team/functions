import { Request, Response } from 'express'
import { doc, updateDoc, addDoc, getDoc, collection } from 'firebase/firestore'
import { db, judge_url } from './util'
import axios from 'axios'

export async function judge_is_online(_req: Request, res: Response) {
  try {
    const url = judge_url + '/about'
    const judge_res = await axios.get(url)
    if (judge_res.status != 200) {
      return res.status(400).json({ status: 'The judge is not online.' })
    } else {
      const time = new Date()
      const updatedTime = { time: time }
      let response = 500
      await updateDoc(doc(db, 'JudgeData', 'LastOnline'), updatedTime)
        .then(() => {
          response = 200
        })
        .catch(() => {
          response = 500
        })
      return res
        .status(response)
        .json(
          response == 200
            ? { status: 'The judge is online' }
            : { status: 'Internal Server Error' },
        )
    }
  } catch (err) {
    return res.status(500).json({ status: 'Internal Server Error' })
  }
}

export async function submit(req: Request, res: Response) {
  const url = judge_url + '/submissions/batch?base64_encoded=true'

  const code = req.body.source_code
  const inputs = req.body.inputs
  const outputs = req.body.outputs
  const language_string = req.body.language_id

  let language = 0
  if (language_string == 'c') {
    language = 50
  } else if (language_string == 'cpp') {
    language = 54
  } else if (language_string == 'java') {
    language = 62
  } else if (language_string == 'py') {
    language = 71
  } else {
    return res.status(400).json({ error: 'Invalid language' })
  }

  let compiler_flags = ''
  let args = ''

  // TODO: Add time/memory limits
  // TODO: Add the submission IDs to the user's data
  // TODO: For problems in the database, grab the data and use that for input/output

  // C = 50, C++ = 54, Java = 62, Python: 71 (does not use pypy in default judge0)

  if (language == 50) {
    compiler_flags = '-g -O2 -std=c11'
  } else if (language == 54) {
    compiler_flags = '-g -O2 -std=c++17'
  } else if (language == 62) {
    args = '-Xss64m' // TODO(Alanna): fix this line if needed (or delete this TODO)
  }

  const submissions: {
    source_code: string
    stdin: string
    expected_output: string
    language_id: number
    compiler_options: string
    command_line_arguments: string
  }[] = []

  if (inputs.length != outputs.length) {
    return res
      .status(400)
      .json({ error: 'Different number of inputs and outputs.' })
  }

  if (inputs.length == 0 || outputs.length == 0) {
    return res.status(400).json({ error: 'No inputs or expected outputs.' })
  }

  for (let i = 0; i < inputs.length; i++) {
    submissions.push({
      source_code: code,
      stdin: inputs[i],
      expected_output: outputs[i],
      language_id: language,
      compiler_options: compiler_flags,
      command_line_arguments: args,
    })
  }

  const tokens: string[] = []
  try {
    const judge_res = await axios.post(url, { submissions: submissions })
    if (judge_res.status != 201) {
      return res.status(judge_res.status).json(judge_res.data)
    } else {
      const responses = judge_res.data
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].token != undefined) {
          tokens.push(responses[i].token)
        } else {
          tokens.push('')
        }
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err })
  }
  const date = new Date()
  addDoc(collection(db, 'Submissions'), {
    uid: req.body.uid,
    sourceCode: code,
    tokens: tokens,
    pending: true,
    date: date,
    problem_id: -1,
    total_cases: tokens.length,
    verdict: 1,
  })
    .then((id) => {
      return res.status(201).json({ token: id.id })
    })
    .catch((err) => {
      return res.status(500).json({ error: err })
    })
  return
}

export async function get_verdict(req: Request, res: Response) {
  // TODO: After the submission is no longer pending, delete it :)
  const submission_id: string = req.body.token
  await getDoc(doc(db, 'Submissions', submission_id))
    .then(async (submission) => {
      if (submission.exists()) {
        const info = submission.data()
        if (info.pending == true) {
          let token_string = ''
          for (let i = 0; i < info.tokens.length; i++) {
            token_string += info.tokens[i]
            if (i < info.tokens.length - 1) {
              token_string += ','
            }
          }

          const url =
            judge_url +
            '/submissions/batch?tokens=' +
            token_string +
            '&fields=status_id,time'
          const judge_res = await axios.get(url)

          const response_list = judge_res.data.submissions

          let verdict = 0
          const verdict_list: number[] = []
          let time = 0
          let pass_count = 0
          let pending = false
          for (let i = 0; i < response_list.length; i++) {
            if (response_list[i].status_id == 3) {
              pass_count++
            }
            if (response_list[i].status_id < 3) {
              pending = true
            }
            verdict = Math.max(verdict, response_list[i].status_id)
            verdict_list.push(response_list[i].status_id)
            time = Math.max(time, response_list[i].time)
          }

          const new_object = submission.data()
          new_object.verdict = verdict
          new_object.verdict_list = verdict_list
          new_object.time = time
          new_object.passed_cases = pass_count
          new_object.pending = pending

          updateDoc(doc(db, 'Submissions', submission_id), new_object)
            .then(() => {
              return res.status(200).json({
                date: new_object.date,
                problem_id: new_object.problem_id,
                verdict: verdict,
                verdict_list: verdict_list,
                passed_cases: pass_count,
                total_cases: new_object.total_cases,
              })
            })
            .catch((err) => {
              return res.status(500).json({ error: err })
            })
          return
        } else {
          return res.status(200).json({
            date: info.date,
            problem_id: info.problem_id,
            verdict: info.verdict,
            verdict_list: info.verdict_list,
            passed_cases: info.passed_cases,
            total_cases: info.total_cases,
          })
        }
      } else {
        return res.status(404).json({ error: 'Submission id not found.' })
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err })
    })
}
