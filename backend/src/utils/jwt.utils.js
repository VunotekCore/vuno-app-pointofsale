import jwt from 'jsonwebtoken'

function getSecret () {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

export const generateToken = (payload, expirationSeconds = 3600) => {
  return jwt.sign(payload, getSecret(), { expiresIn: expirationSeconds })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret())
  } catch (error) {
    return null
  }
}
