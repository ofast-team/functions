import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyD1yV--rl-qJiyvwju2K9jz_jkhvr8sTHw',
  authDomain: 'ofast-e6866.firebaseapp.com',
  projectId: 'ofast-e6866',
  storageBucket: 'ofast-e6866.appspot.com',
  messagingSenderId: '660869453090',
  appId: '1:660869453090:web:b919fe7e93c35a77a5417b',
  measurementId: 'G-3B0LRWZFH5',
}

const appInit = initializeApp(firebaseConfig)

export const auth: Auth = getAuth()
export const db: Firestore = getFirestore(appInit)

export const verdict_consts = [
  {"id": 0,
    "description": "Something went very wrong"
  },
  {
    "id": 1,
    "description": "In Queue"
  },
  {
    "id": 2,
    "description": "Processing"
  },
  {
    "id": 3,
    "description": "Accepted"
  },
  {
    "id": 4,
    "description": "Wrong Answer"
  },
  {
    "id": 5,
    "description": "Time Limit Exceeded"
  },
  {
    "id": 6,
    "description": "Compilation Error"
  },
  {
    "id": 7,
    "description": "Runtime Error (SIGSEGV)"
  },
  {
    "id": 8,
    "description": "Runtime Error (SIGXFSZ)"
  },
  {
    "id": 9,
    "description": "Runtime Error (SIGFPE)"
  },
  {
    "id": 10,
    "description": "Runtime Error (SIGABRT)"
  },
  {
    "id": 11,
    "description": "Runtime Error (NZEC)"
  },
  {
    "id": 12,
    "description": "Runtime Error (Other)"
  },
  {
    "id": 13,
    "description": "Internal Error"
  },
  {
    "id": 14,
    "description": "Exec Format Error"
  }
]