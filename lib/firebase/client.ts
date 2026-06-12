'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'

import { firebaseConfig, useFirebaseEmulators } from '@/lib/firebase/config'

const EMULATOR_HOST = '127.0.0.1'

function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

function connectEmulators(
  auth: Auth,
  firestore: Firestore,
  storage: FirebaseStorage
): void {
  if (typeof window === 'undefined' || useFirebaseEmulators !== true) {
    return
  }

  const globalKey = '__insurwalletFirebaseEmulatorsConnected__'
  const win = window as Window & { [globalKey]?: boolean }

  if (win[globalKey]) {
    return
  }

  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
    disableWarnings: true,
  })
  connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080)
  connectStorageEmulator(storage, EMULATOR_HOST, 9199)

  win[globalKey] = true
}

const app = getFirebaseApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

connectEmulators(auth, db, storage)

export { app }
