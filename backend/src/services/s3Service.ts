import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const client = new S3Client({ region: process.env.AWS_REGION })

export async function saveToS3(bucket: string, key: string, data: object): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  )
}
