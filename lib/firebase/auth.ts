'use client'

import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import {
  type PreferredLanguage,
  UserProfileSchema,
  defaultNotificationChannels,
  defaultNotificationPrefs,
} from '@/lib/schemas/user'

import {
  clearServerSession,
  createServerSession,
} from '@/lib/firebase/session-cookie'
import { userNeedsEmailVerification } from '@/lib/firebase/session-claims'

function buildDefaultProfile(
  email: string,
  displayName: string,
  preferredLanguage: PreferredLanguage,
  photoURL?: string
) {
  return UserProfileSchema.parse({
    email,
    displayName,
    ...(photoURL ? { photoURL } : {}),
    preferredLanguage,
    subscription: {
      plan: 'free',
      status: 'active',
    },
    notificationPrefs: defaultNotificationPrefs(),
    notificationChannels: defaultNotificationChannels(),
  })
}

async function getAuthModule() {
  const [{ auth, db }, firebaseAuth] = await Promise.all([
    import('@/lib/firebase/client'),
    import('firebase/auth'),
  ])

  return { auth, db, firebaseAuth }
}

export async function ensureUserProfile(
  user: User,
  preferredLanguage: PreferredLanguage
): Promise<void> {
  if (!user.email) {
    throw new Error('User email is required to create a profile')
  }

  const { db } = await import('@/lib/firebase/client')
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    return
  }

  const displayName =
    user.displayName?.trim() || user.email.split('@')[0] || 'User'

  await setDoc(
    userRef,
    buildDefaultProfile(
      user.email,
      displayName,
      preferredLanguage,
      user.photoURL ?? undefined
    )
  )
}

async function persistSession(user: User, forceRefresh = false): Promise<User> {
  const token = await user.getIdToken(forceRefresh)
  await createServerSession(token)
  return user
}

function getVerificationContinueUrl(locale: PreferredLanguage): string {
  if (typeof window === 'undefined') {
    return `/${locale}/verify-email`
  }

  return `${window.location.origin}/${locale}/verify-email`
}

export async function sendUserVerificationEmail(
  user: User,
  locale: PreferredLanguage
): Promise<void> {
  const { firebaseAuth } = await getAuthModule()
  await firebaseAuth.sendEmailVerification(user, {
    url: getVerificationContinueUrl(locale),
  })
}

export async function resendVerificationEmail(
  locale: PreferredLanguage
): Promise<void> {
  const { auth } = await getAuthModule()
  const user = auth.currentUser

  if (!user) {
    throw new Error('No authenticated user')
  }

  await sendUserVerificationEmail(user, locale)
}

export async function reloadCurrentUser(): Promise<User | null> {
  const { auth, firebaseAuth } = await getAuthModule()
  const user = auth.currentUser

  if (!user) {
    return null
  }

  await firebaseAuth.reload(user)
  return persistSession(user, true)
}

export { userNeedsEmailVerification }

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  preferredLanguage: PreferredLanguage
): Promise<User> {
  const { auth, firebaseAuth } = await getAuthModule()
  const credential = await firebaseAuth.createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  const trimmedName = displayName.trim() || email.split('@')[0] || 'User'

  await firebaseAuth.updateProfile(credential.user, {
    displayName: trimmedName,
  })
  await ensureUserProfile(credential.user, preferredLanguage)
  await sendUserVerificationEmail(credential.user, preferredLanguage)

  return persistSession(credential.user)
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const { auth, firebaseAuth } = await getAuthModule()
  const credential = await firebaseAuth.signInWithEmailAndPassword(
    auth,
    email,
    password
  )
  return persistSession(credential.user)
}

export async function signInWithGoogle(
  preferredLanguage: PreferredLanguage
): Promise<User> {
  const { auth, firebaseAuth } = await getAuthModule()
  const provider = new firebaseAuth.GoogleAuthProvider()
  const credential = await firebaseAuth.signInWithPopup(auth, provider)
  await ensureUserProfile(credential.user, preferredLanguage)
  return persistSession(credential.user)
}

export async function signOut(): Promise<void> {
  await clearServerSession()
  const { auth, firebaseAuth } = await getAuthModule()
  await firebaseAuth.signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  const { auth, firebaseAuth } = await getAuthModule()
  await firebaseAuth.sendPasswordResetEmail(auth, email)
}

export function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'emailInUse'
      case 'auth/invalid-email':
        return 'invalidEmail'
      case 'auth/weak-password':
        return 'weakPassword'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'invalidCredentials'
      case 'auth/too-many-requests':
        return 'tooManyRequests'
      case 'auth/popup-closed-by-user':
        return 'popupClosed'
      default:
        return 'genericError'
    }
  }

  return 'genericError'
}
