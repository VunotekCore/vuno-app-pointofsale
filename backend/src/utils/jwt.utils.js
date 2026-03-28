import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'vunotek'

export const generateToken = (payload, expirationSeconds = 3600000) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expirationSeconds })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const decodeToken = (token) => {
  return jwt.decode(token)
}
