// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCFnACYQkAJVirwb-KHjjTJiHLP0yACbF0',
  authDomain: 'finance-tracker-919b2.firebaseapp.com',
  projectId: 'finance-tracker-919b2',
  storageBucket: 'finance-tracker-919b2.firebasestorage.app',
  messagingSenderId: '547755838846',
  appId: '1:547755838846:web:9369a43c928456d8dc372f',
  measurementId: 'G-K18VCVL3J9',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Analytics (browser only)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app)
    }
  })
}
