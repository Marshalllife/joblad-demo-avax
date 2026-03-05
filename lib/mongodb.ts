import mongoose, { Mongoose } from 'mongoose'

interface MongooseCache {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

declare global {
  var mongoose: MongooseCache
}

let cached: MongooseCache = globalThis.mongoose || { conn: null, promise: null }

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null }
}

async function dbConnect(): Promise<Mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('Please define the MONGODB_URI environment variable')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m)
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
