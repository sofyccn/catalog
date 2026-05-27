import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

let client: S3Client | null = null

export function r2Configured(): boolean {
  return !!(
    env.R2_ENDPOINT &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME &&
    env.R2_PUBLIC_URL
  )
}

function getClient(): S3Client {
  if (!r2Configured()) throw new Error('R2 no está configurado')
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    })
  }
  return client
}

export function publicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`
}

/** Upload bytes to R2 and return the public URL. */
export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key, Body: body, ContentType: contentType }),
  )
  return publicUrl(key)
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key }))
}

/** Recover the object key from a stored public URL (for deletes). */
export function keyFromUrl(url: string): string | null {
  const base = env.R2_PUBLIC_URL?.replace(/\/$/, '')
  if (base && url.startsWith(base + '/')) return url.slice(base.length + 1)
  return null
}
