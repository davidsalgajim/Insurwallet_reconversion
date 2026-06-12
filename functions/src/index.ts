import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'

import { refreshPolicyStatuses } from './refresh-policy-status'

initializeApp()

export const hello = onRequest((_request, response) => {
  response.status(200).json({ message: 'Hello from InsurWallet Functions' })
})

export { refreshPolicyStatuses }
