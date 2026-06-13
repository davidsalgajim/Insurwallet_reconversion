export const NO_EXPIRATION_END_DATE = new Date('2099-12-31T00:00:00.000Z')

export function resolveEndDateForStorage(
  endDate: Date,
  hasNoExpiration: boolean
): Date {
  return hasNoExpiration ? NO_EXPIRATION_END_DATE : endDate
}
