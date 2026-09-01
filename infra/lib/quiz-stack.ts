import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as iam from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'
import * as path from 'path'

export class QuizStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // S3 bucket — block all public access
    const resultsBucket = new s3.Bucket(this, 'QuizResultsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
    })

    // SNS topic for student notifications
    const notificationTopic = new sns.Topic(this, 'QuizNotificationTopic', {
      topicName: 'quiz-student-notifications',
      displayName: 'Quiz Student Notifications',
    })

    // Lambda function — notify-student
    const notifyLambda = new lambdaNode.NodejsFunction(this, 'NotifyStudentLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, 'lambda', 'notify-student', 'index.ts'),
      handler: 'handler',
      environment: {
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Reads quiz result from S3 and sends email notification via SNS',
    })

    // IAM — minimal permissions, no wildcards
    notifyLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${resultsBucket.bucketArn}/results/*`],
      })
    )

    notifyLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish', 'sns:Subscribe', 'sns:ListSubscriptionsByTopic'],
        resources: [notificationTopic.topicArn],
      })
    )

    // S3 event notification → Lambda on every results/ upload
    resultsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(notifyLambda),
      { prefix: 'results/' }
    )

    // Outputs for use in GitHub Actions secrets and backend env vars
    new cdk.CfnOutput(this, 'BucketName', {
      value: resultsBucket.bucketName,
      description: 'S3 bucket name — set as S3_BUCKET in Railway and GitHub Actions secrets',
      exportName: 'QuizResultsBucketName',
    })

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN — set as SNS_TOPIC_ARN in GitHub Actions secrets',
      exportName: 'QuizSnsTopicArn',
    })

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: notifyLambda.functionName,
      description: 'Lambda function name',
    })
  }
}
