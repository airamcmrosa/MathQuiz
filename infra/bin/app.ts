import * as cdk from 'aws-cdk-lib'
import { QuizStack } from '../lib/quiz-stack'

const app = new cdk.App()

new QuizStack(app, 'QuizStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'Quiz Web App — S3 results bucket, Lambda notifier, SNS topic',
  tags: {
    Project: 'quiz-web-app',
    ManagedBy: 'cdk',
  },
})
