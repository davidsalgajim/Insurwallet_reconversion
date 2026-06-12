import { initializeApp } from 'firebase-admin/app'

import { deleteUserAccount } from './account/delete-user-account'
import { exportUserData } from './account/export-user-data'
import { onPolicyDocumentUpload } from './on-storage-upload'
import { createCheckout } from './payments/create-checkout'
import { wompiPaymentWebhook } from './payments/webhook'
import { sendExpiryReminders } from './notifications/expiry-reminders'
import { refreshPolicyStatuses } from './refresh-policy-status'

initializeApp()

export {
  createCheckout,
  deleteUserAccount,
  exportUserData,
  onPolicyDocumentUpload,
  refreshPolicyStatuses,
  sendExpiryReminders,
  wompiPaymentWebhook,
}
