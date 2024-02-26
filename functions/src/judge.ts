import { Request, Response } from 'express'
import { doc, updateDoc, addDoc, getDoc, collection } from 'firebase/firestore'
import { db, verdict_consts } from './util'
import axios from 'axios'



const base_url = "http://174.138.86.255:2358"

export async function judgeIsOnline(req: Request, res: Response) {
    try {
        const url = base_url + "/about"
        const judge_res = await axios.get(url)
        if (judge_res.status != 200) {
            return res.status(400).json({ status: 'The judge is not online.' })
        } else {
            let time = new Date()
            let updatedTime = { time: time }
            let response = 500
            await updateDoc(doc(db, 'JudgeData', 'LastOnline'), updatedTime)
                .then(() => {
                    response = 200
                })
                .catch(() => {
                    response = 500
                })
            return res.status(response).json(response == 200 ? { status: 'The judge is online' } : { status: 'Internal Server Error' })
        }
    } catch (err) {
        return res.status(500).json({ status: 'Internal Server Error' })
    }
}

export async function submit(req: Request, res: Response) {
    const url = base_url + "/submissions/?base64_encoded=true"
    const code = req.body.source_code
    const inputs = req.body.inputs
    const outputs = req.body.outputs
    const language = req.body.language_id
    let compiler_flags = "";
    let args = "";

    // TODO: Add time limits
    // TODO: Add the submission IDs to the user's data

    // C = 50, C++ = 54, Java = 62

    // Java classes must be named "Main"
    if (language == 50) {
        compiler_flags = "-g -O2 -std=c11"
    } else if (language == 54) {
        compiler_flags = "-g -O2 -std=c++17"
    } else if (language == 62) {
        args = "-Xss64m", "-Xmx2048m"
    }


    let submissions: { source_code: string, stdin: string, expected_output: string, language_id: number, compiler_options: string, command_line_arguments: string }[] = []

    if (inputs.length != outputs.length) {
        return res.status(400).json({ error: "Different number of inputs and outputs." })
    }

    if (inputs.length == 0) {
        return res.status(400).json({ error: "No inputs or expected outputs." })
    }

    // TODO: Check valid language

    // TODO: Encrypt using base64

    for (let i = 0; i < inputs.length; i++) {
        submissions.push({ source_code: code, stdin: inputs[i], expected_output: outputs[i], language_id: language, compiler_options: compiler_flags, command_line_arguments: args })
    }

    let tokens: string[] = Array(inputs.length).fill("")
    try {
        for (let i = 0; i < submissions.length; i++) {
            let judge_res = await axios.post(url, submissions[i])
            if (judge_res.status != 201) {
                tokens[i] = ""
            } else {
                tokens[i] = judge_res.data.token
            }
        }

    } catch (err) {
        return res.status(500).json({ error: err, tokens: tokens })
    }
    addDoc(collection(db, 'Submissions'), { tokens: tokens })
        .then((id) => {
            return res.status(201).json({ token: id.id })
        })
        .catch((err) => {
            return res.status(500).json({ error: err })
        })
    return
}

async function fetch_verdicts(submission_id: string): Promise<{ status: number, retval: { error: any | undefined, verdicts: any[] | undefined } }> {
    try {
        const a = await getDoc(doc(db, 'Submissions', submission_id))
        if (a.exists()) {
            if (a.data().verdicts != null) {
                return { status: 200, retval: { verdicts: a.data().verdicts, error: undefined } }
            } else {
                let tokens = a.data().tokens
                let new_submission = a.data()
                if (tokens.length == 0) {
                    return { status: 204, retval: { verdicts: undefined, error: "Submission ID found, but no test cases found." } }
                } else {
                    let verdicts = Array(tokens.length).fill("")
                    let url = base_url + "/submissions"
                    for (let i = 0; i < tokens.length; i++) {
                        let judge_res = await axios.get(url + "/" + tokens[i] + "?base64_encoded=true")
                        verdicts[i] = judge_res.data.status
                    }
                    new_submission.verdicts = verdicts
                    let status = 500
                    let error = ""
                    await updateDoc(doc(db, 'Submissions', submission_id), new_submission)
                        .then(() => {
                            status = 200
                        })
                        .catch(() => {
                            status = 500
                            error = "Something went wrong when saving the verdicts."
                        })
                    if (error == "") {
                        return { status: status, retval: { verdicts: verdicts, error: undefined } }
                    } else {
                        return { status: status, retval: { verdicts: verdicts, error: error } }
                    }
                }
            }
        } else {
            return { status: 404, retval: { verdicts: undefined, error: "Submission id not found." } }
        }
    } catch (err) {
        return { status: 500, retval: { verdicts: undefined, error: err } }
    }
}


export async function get_verdict_list(req: Request, res: Response) {
    const verdicts = await fetch_verdicts(req.body.token)
    return res.status(verdicts.status).json(verdicts.retval)
}


// TODO: Fix invalid argument error....
export async function get_verdict_final(req: Request, res: Response) {
    const submission_id = req.body.token
    getDoc(doc(db, 'Submissions', submission_id))
        .then(async (a) => {
            if (a.exists()) {
                if (a.data().final_verdict != null) {
                    return res.status(200).json(a.data().final_verdict)
                } else {
                    let verdicts = await fetch_verdicts(submission_id)
                    let verdict_list = verdicts.retval.verdicts
                    if (verdict_list != undefined) {
                        let final_verdict = 0
                        for (let i = 0; i < verdict_list.length; i++) {
                            final_verdict = Math.max(final_verdict, verdict_list[i].id)
                        }
                        let newDoc = a.data()
                        newDoc.final_verdict = verdict_list[final_verdict]
                        let status = 500
                        let error = ""
                        updateDoc(doc(db, 'Submissions', submission_id), newDoc)
                            .then(() => {
                                status = 200
                            })
                            .catch(() =>  {
                                status = 500
                                error = "Something went wrong when saving the verdict."
                                if (status == 1) {
                                    console.log(status)
                                }
                            })
                        if (status = 200) {
                            return res.status(200).json({verdict: verdict_consts[final_verdict]})
                        } else {
                            return res.status(500).json({verdict: verdict_consts[final_verdict], error: error})
                        }
                    } else {
                        return res.status(verdicts.status).json(verdicts.retval)
                    }
                }
            } else {
                return res.status(404).json({error: "Submission id not found."})
            }
        })
        .catch((err) => {
            return res.status(500).json({error: err})
        })
}