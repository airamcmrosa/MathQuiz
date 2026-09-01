import type { S3Event } from 'aws-lambda'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import {
  SNSClient,
  PublishCommand,
  SubscribeCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns'

const s3Client = new S3Client({})
const snsClient = new SNSClient({})

interface QuizResult {
  studentName: string
  studentEmail: string
  score: number
  answers: number[]
  completedAt: string
}

async function ensureEmailSubscribed(topicArn: string, email: string): Promise<void> {
  const subs = await snsClient.send(
    new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
  )

  const isConfirmed = subs.Subscriptions?.some(
    (s) =>
      s.Protocol === 'email' &&
      s.Endpoint === email &&
      s.SubscriptionArn !== 'PendingConfirmation'
  )

  if (!isConfirmed) {
    await snsClient.send(
      new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: email,
      })
    )
  }
}

export async function handler(event: S3Event): Promise<void> {
  const topicArn = process.env.SNS_TOPIC_ARN

  if (!topicArn) {
    throw new Error('SNS_TOPIC_ARN environment variable is not set')
  }

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

    try {
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const body = await obj.Body?.transformToString()

      if (!body) {
        console.error(`[notify-student] Empty object body for key: ${key}`)
        continue
      }

      const result = JSON.parse(body) as QuizResult
      const { studentEmail, studentName, score } = result

      await ensureEmailSubscribed(topicArn, studentEmail)

      await snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: `Seu resultado do Quiz — ${score}/10`,
          Message: [
            `Olá ${studentName},`,
            '',
            `Parabéns por completar o quiz! Aqui está seu resultado:`,
            '',
            `Pontuação: ${score}/10`,
            `Data: ${new Date(result.completedAt).toLocaleString('pt-BR')}`,
            '',
            'Obrigado por participar!',
          ].join('\n'),
        })
      )

      console.log(`[notify-student] Notification sent to ${studentEmail} (score: ${score}/10)`)
    } catch (err) {
      console.error(`[notify-student] Error processing record ${key}:`, err)
      throw err
    }
  }
}
