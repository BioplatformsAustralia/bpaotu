import { Sha256 } from '@aws-crypto/sha256-js'

// this needs to be kept in sync with the plugins defined for Analytics
export const pluginsList = ['mixpanel']

// convert the email to a sha256 hash and use this as the analytics userId so as to not send PII to GA
// we don't retain a record of this to examine for our own purposes since we don't care who the user is
// just that their interactions are associated with them across different devices and sessions
export const triggerHashedIdentify = async (identify, email) => {
  let hashSalt = 'd260c5eb-055b-4640-966d-1f657aec34b4'

  const hash = new Sha256()
  hash.update(email.toLowerCase() + hashSalt)
  const hashed = await hash.digest()
  const hashedEmail = [].map
    .call(new Uint8Array(hashed), (b) => ('00' + b.toString(16)).slice(-2))
    .join('')

  // rather than awaiting the promise elsewhere and then firing an identify just send it here
  identify(hashedEmail, {
    uid: hashedEmail,
  })
}
