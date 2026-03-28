export function generateUUID () {
  return 'UUID()'
}

export function uuidToBin (uuid) {
  if (!uuid) return null
  if (uuid === 'UUID()') return 'UUID_TO_BIN(UUID())'
  return `UUID_TO_BIN('${uuid}')`
}

export function binToUuid (column) {
  return `BIN_TO_UUID(${column})`
}

export function uuidParam (uuid) {
  return uuid
}
