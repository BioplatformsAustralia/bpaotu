import stringify from 'json-stable-stringify'

export const createSearchHash = (params) => {
  const str = stringify(params)

  // Simple deterministic hash
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }

  return hash.toString()
}
