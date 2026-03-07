import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as path from 'path';
import { Construct } from 'constructs';

export class EligibilityMvpStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly table: dynamodb.Table;
  public readonly documentBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Single Table Design
    this.table = new dynamodb.Table(this, 'EligibilityTable', {
      tableName: 'eligibility-mvp-table',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For MVP only
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI for querying by entity type
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI for location-based queries
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'GSI2PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI2SK',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // S3 Bucket for Document Uploads
    this.documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `eligibility-mvp-documents-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For MVP only
      autoDeleteObjects: true, // For MVP only
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Amazon Cognito User Pool - Email Authentication
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'eligibility-mvp-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true, // Changed from phone to email
      },
      autoVerify: {
        email: true, // Changed from phone to email
      },
      standardAttributes: {
        email: {
          required: true, // Email is now required
          mutable: true,
        },
        phoneNumber: {
          required: false, // Phone is now optional
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY, // Changed to email-only recovery
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For MVP only
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false, // Disabled SMS MFA
        otp: true, // Enabled TOTP MFA instead
      },
    });

    // User Pool Client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: 'eligibility-mvp-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // API Gateway with Cognito Authorizer
    this.api = new apigateway.RestApi(this, 'EligibilityApi', {
      restApiName: 'Eligibility MVP API',
      description: 'API for Eligibility-First Community Access Platform MVP',
      deployOptions: {
        stageName: 'v1',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Cognito Authorizer for API Gateway
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [this.userPool],
        authorizerName: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization',
      }
    );

    // CloudWatch Log Groups with 7-day retention
    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/aws/apigateway/eligibility-mvp',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/eligibility-mvp',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda Functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant Lambda permissions to DynamoDB
    this.table.grantReadWriteData(lambdaRole);

    // Grant Lambda permissions to S3
    this.documentBucket.grantReadWrite(lambdaRole);

    // Grant Lambda permissions to Bedrock (foundation models and inference profiles)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          // Foundation models in ap-south-1 (local region)
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-micro-v1:0`,
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
          // Foundation models in APAC regions (for inference profile routing)
          'arn:aws:bedrock:ap-southeast-2::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:ap-northeast-1::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:ap-northeast-2::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:ap-southeast-1::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:ap-northeast-3::foundation-model/amazon.nova-lite-v1:0',
          // Inference profiles (required for Nova models)
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/apac.amazon.nova-lite-v1:0`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/apac.amazon.nova-micro-v1:0`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/apac.amazon.nova-pro-v1:0`,
        ],
      })
    );

    // Lambda Function for User Profile CRUD Operations
    const profileLambda = new lambda.Function(this, 'ProfileFunction', {
      functionName: 'eligibility-mvp-profile',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'profile-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda-dist')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda Function for Eligibility Evaluation
    const eligibilityLambda = new lambda.Function(this, 'EligibilityFunction', {
      functionName: 'eligibility-mvp-eligibility',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'eligibility-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda-dist')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.table.tableName,
      },
      timeout: cdk.Duration.seconds(60), // Longer timeout for LLM calls
      memorySize: 1024, // More memory for LLM processing
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda Function for Document Management
    const documentLambda = new lambda.Function(this, 'DocumentFunction', {
      functionName: 'eligibility-mvp-document',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'document-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda-dist')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.table.tableName,
        DOCUMENT_BUCKET_NAME: this.documentBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda Function for Document Processing (S3 Event Trigger)
    const documentProcessorLambda = new lambda.Function(this, 'DocumentProcessorFunction', {
      functionName: 'eligibility-mvp-document-processor',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'document-processor-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda-dist')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.table.tableName,
        DOCUMENT_BUCKET_NAME: this.documentBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda Function for Scheme Discovery and Management
    const schemeLambda = new lambda.Function(this, 'SchemeFunction', {
      functionName: 'eligibility-mvp-scheme',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'scheme-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda-dist')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.table.tableName,
        DYNAMODB_TABLE_NAME: this.table.tableName,
      },
      timeout: cdk.Duration.seconds(90), // Longer timeout for web search + LLM
      memorySize: 1024, // More memory for LLM processing
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Add S3 event notification for document processing
    this.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(documentProcessorLambda),
      { prefix: 'documents/' }
    );

    // API Gateway Resources and Methods
    const profiles = this.api.root.addResource('profiles');
    
    // POST /profiles - Create profile
    profiles.addMethod('POST', new apigateway.LambdaIntegration(profileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /profiles/{userId} - Get profile by ID
    const profileById = profiles.addResource('{userId}');
    profileById.addMethod('GET', new apigateway.LambdaIntegration(profileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // PUT /profiles/{userId} - Update profile
    profileById.addMethod('PUT', new apigateway.LambdaIntegration(profileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // DELETE /profiles/{userId} - Delete profile
    profileById.addMethod('DELETE', new apigateway.LambdaIntegration(profileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /profiles/phone/{phoneNumber} - Get profile by phone number
    const profileByPhone = profiles.addResource('phone').addResource('{phoneNumber}');
    profileByPhone.addMethod('GET', new apigateway.LambdaIntegration(profileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Eligibility API endpoints
    const api = this.api.root.addResource('api');
    const v1 = api.addResource('v1');
    const eligibility = v1.addResource('eligibility');

    // POST /api/v1/eligibility/evaluate - Main eligibility evaluation endpoint
    const evaluate = eligibility.addResource('evaluate');
    evaluate.addMethod('POST', new apigateway.LambdaIntegration(eligibilityLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /api/v1/eligibility/evaluate-all - Evaluate all schemes
    const evaluateAll = eligibility.addResource('evaluate-all');
    evaluateAll.addMethod('POST', new apigateway.LambdaIntegration(eligibilityLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /api/v1/eligibility/re-evaluate - Re-evaluate after profile update
    const reEvaluate = eligibility.addResource('re-evaluate');
    reEvaluate.addMethod('POST', new apigateway.LambdaIntegration(eligibilityLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /api/v1/eligibility/user/{userId} - Retrieve past evaluations
    const user = eligibility.addResource('user');
    const userById = user.addResource('{userId}');
    userById.addMethod('GET', new apigateway.LambdaIntegration(eligibilityLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Document API endpoints
    const documents = this.api.root.addResource('documents');

    // POST /documents/upload-url - Generate pre-signed upload URL
    const uploadUrl = documents.addResource('upload-url');
    uploadUrl.addMethod('POST', new apigateway.LambdaIntegration(documentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /documents/{documentId} - Get document metadata
    const documentById = documents.addResource('{documentId}');
    documentById.addMethod('GET', new apigateway.LambdaIntegration(documentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // PUT /documents/{documentId}/status - Update document status
    const documentStatus = documentById.addResource('status');
    documentStatus.addMethod('PUT', new apigateway.LambdaIntegration(documentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Scheme API endpoints
    const schemes = v1.addResource('schemes');

    // POST /api/v1/schemes/discover - Discover schemes using Claude
    const discover = schemes.addResource('discover');
    discover.addMethod('POST', new apigateway.LambdaIntegration(schemeLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /api/v1/schemes/add - Add discovered scheme to database
    const addScheme = schemes.addResource('add');
    addScheme.addMethod('POST', new apigateway.LambdaIntegration(schemeLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /api/v1/schemes/list - List all schemes
    const listSchemes = schemes.addResource('list');
    listSchemes.addMethod('GET', new apigateway.LambdaIntegration(schemeLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /documents/user/{userId} - List user documents
    const documentUser = documents.addResource('user').addResource('{userId}');
    documentUser.addMethod('GET', new apigateway.LambdaIntegration(documentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'EligibilityMvpUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'EligibilityMvpUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: 'EligibilityMvpApiUrl',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB Table Name',
      exportName: 'EligibilityMvpTableName',
    });

    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: this.documentBucket.bucketName,
      description: 'S3 Document Bucket Name',
      exportName: 'EligibilityMvpDocumentBucketName',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'EligibilityMvpRegion',
    });

    // ========================================
    // CloudWatch Monitoring and Alarms
    // ========================================

    // SNS Topic for Alarm Notifications
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: 'eligibility-mvp-alarms',
      displayName: 'Eligibility MVP Alarms',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for CloudWatch Alarms',
      exportName: 'EligibilityMvpAlarmTopicArn',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'EligibilityDashboard', {
      dashboardName: 'Eligibility-MVP-Dashboard',
    });

    // API Gateway Metrics
    const apiLatencyMetric = this.api.metricLatency({
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const api4xxErrorMetric = this.api.metricClientError({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const api5xxErrorMetric = this.api.metricServerError({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const apiCountMetric = this.api.metricCount({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Lambda Metrics
    const eligibilityInvocationsMetric = eligibilityLambda.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const eligibilityErrorsMetric = eligibilityLambda.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const eligibilityDurationMetric = eligibilityLambda.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const eligibilityThrottlesMetric = eligibilityLambda.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Custom Metrics from metrics.ts
    const customApiLatencyMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'APILatency',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const customApiErrorMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'APIError',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockCallsMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'BedrockAPICall',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockInputTokensMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'BedrockInputTokens',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockOutputTokensMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'BedrockOutputTokens',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const cacheHitMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'CacheHit',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Result: 'Hit',
      },
    });

    const cacheMissMetric = new cloudwatch.Metric({
      namespace: 'EligibilityMVP',
      metricName: 'CacheHit',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Result: 'Miss',
      },
    });

    // Dashboard Widgets
    dashboard.addWidgets(
      // Row 1: API Gateway Overview
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Request Count',
        left: [apiCountMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency',
        left: [apiLatencyMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      // Row 2: API Gateway Errors
      new cloudwatch.GraphWidget({
        title: 'API Gateway - 4xx Errors',
        left: [api4xxErrorMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - 5xx Errors',
        left: [api5xxErrorMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Error Rate %',
        left: [
          new cloudwatch.MathExpression({
            expression: '(m1 / m2) * 100',
            usingMetrics: {
              m1: api5xxErrorMetric,
              m2: apiCountMetric,
            },
            label: 'Error Rate %',
          }),
        ],
        width: 8,
      })
    );

    dashboard.addWidgets(
      // Row 3: Lambda Performance
      new cloudwatch.GraphWidget({
        title: 'Eligibility Lambda - Invocations',
        left: [eligibilityInvocationsMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Eligibility Lambda - Duration',
        left: [eligibilityDurationMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Eligibility Lambda - Errors & Throttles',
        left: [eligibilityErrorsMetric, eligibilityThrottlesMetric],
        width: 8,
      })
    );

    dashboard.addWidgets(
      // Row 4: Custom Metrics
      new cloudwatch.GraphWidget({
        title: 'Custom API Latency by Endpoint',
        left: [customApiLatencyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Custom API Errors by Type',
        left: [customApiErrorMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      // Row 5: Bedrock Usage and Costs
      new cloudwatch.GraphWidget({
        title: 'Bedrock API Calls',
        left: [bedrockCallsMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bedrock Input Tokens',
        left: [bedrockInputTokensMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bedrock Output Tokens',
        left: [bedrockOutputTokensMetric],
        width: 8,
      })
    );

    dashboard.addWidgets(
      // Row 6: Cache Performance
      new cloudwatch.GraphWidget({
        title: 'Cache Hit vs Miss',
        left: [cacheHitMetric, cacheMissMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Cache Hit Rate %',
        left: [
          new cloudwatch.MathExpression({
            expression: '(m1 / (m1 + m2)) * 100',
            usingMetrics: {
              m1: cacheHitMetric,
              m2: cacheMissMetric,
            },
            label: 'Cache Hit Rate %',
          }),
        ],
        width: 12,
      })
    );

    // ========================================
    // CloudWatch Alarms
    // ========================================

    // Alarm: High API Error Rate (>5%)
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: 'Eligibility-MVP-High-Error-Rate',
      alarmDescription: 'Alert when API error rate exceeds 5%',
      metric: new cloudwatch.MathExpression({
        expression: '(errors / requests) * 100',
        usingMetrics: {
          errors: api5xxErrorMetric,
          requests: apiCountMetric,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highErrorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: High API Latency (>5s)
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      alarmName: 'Eligibility-MVP-High-Latency',
      alarmDescription: 'Alert when API latency exceeds 5 seconds',
      metric: apiLatencyMetric,
      threshold: 5000, // 5 seconds in milliseconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: Lambda Errors
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: 'Eligibility-MVP-Lambda-Errors',
      alarmDescription: 'Alert when Lambda function has errors',
      metric: eligibilityErrorsMetric,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: Lambda Throttles
    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: 'Eligibility-MVP-Lambda-Throttles',
      alarmDescription: 'Alert when Lambda function is throttled',
      metric: eligibilityThrottlesMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaThrottleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: High Bedrock API Call Frequency (cost control)
    const highBedrockCallsAlarm = new cloudwatch.Alarm(this, 'HighBedrockCallsAlarm', {
      alarmName: 'Eligibility-MVP-High-Bedrock-Calls',
      alarmDescription: 'Alert when Bedrock API calls exceed threshold (cost control)',
      metric: bedrockCallsMetric,
      threshold: 100, // Adjust based on expected usage
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highBedrockCallsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: High Bedrock Token Usage (cost control)
    const highBedrockTokensAlarm = new cloudwatch.Alarm(this, 'HighBedrockTokensAlarm', {
      alarmName: 'Eligibility-MVP-High-Bedrock-Tokens',
      alarmDescription: 'Alert when Bedrock token usage is high (cost control)',
      metric: new cloudwatch.MathExpression({
        expression: 'input + output',
        usingMetrics: {
          input: bedrockInputTokensMetric,
          output: bedrockOutputTokensMetric,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50000, // Adjust based on expected usage
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highBedrockTokensAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: Low Cache Hit Rate
    const lowCacheHitRateAlarm = new cloudwatch.Alarm(this, 'LowCacheHitRateAlarm', {
      alarmName: 'Eligibility-MVP-Low-Cache-Hit-Rate',
      alarmDescription: 'Alert when cache hit rate is below 50%',
      metric: new cloudwatch.MathExpression({
        expression: '(hits / (hits + misses)) * 100',
        usingMetrics: {
          hits: cacheHitMetric,
          misses: cacheMissMetric,
        },
        period: cdk.Duration.minutes(15),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lowCacheHitRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ========================================
    // API Gateway Rate Limiting (Cost Optimization)
    // ========================================

    // Create API Key for usage tracking
    const apiKey = this.api.addApiKey('ApiKey', {
      apiKeyName: 'eligibility-mvp-api-key',
      description: 'API Key for Eligibility MVP',
    });

    // Create Usage Plan with throttling and quota limits
    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: 'Eligibility-MVP-Usage-Plan',
      description: 'Usage plan with rate limiting for cost control',
      throttle: {
        rateLimit: 10, // 10 requests per second
        burstLimit: 20, // 20 concurrent requests
      },
      quota: {
        limit: 10000, // 10,000 requests per month
        period: apigateway.Period.MONTH,
      },
    });

    // Associate usage plan with API stage
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Associate API key with usage plan
    usagePlan.addApiKey(apiKey);

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Gateway API Key ID',
      exportName: 'EligibilityMvpApiKeyId',
    });

    // ========================================
    // AWS Budget Alerts (Cost Optimization)
    // ========================================

    // Budget Alert at ₹1,000 (approximately $12 USD)
    new budgets.CfnBudget(this, 'Budget1000', {
      budget: {
        budgetName: 'Eligibility-MVP-Budget-1000-INR',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 12, // $12 USD (approximately ₹1,000)
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80, // Alert at 80% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100, // Alert at 100% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
      ],
    });

    // Budget Alert at ₹3,000 (approximately $36 USD)
    new budgets.CfnBudget(this, 'Budget3000', {
      budget: {
        budgetName: 'Eligibility-MVP-Budget-3000-INR',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 36, // $36 USD (approximately ₹3,000)
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80, // Alert at 80% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100, // Alert at 100% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
      ],
    });

    // Budget Alert at ₹5,000 (approximately $60 USD)
    new budgets.CfnBudget(this, 'Budget5000', {
      budget: {
        budgetName: 'Eligibility-MVP-Budget-5000-INR',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 60, // $60 USD (approximately ₹5,000)
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80, // Alert at 80% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100, // Alert at 100% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: alarmTopic.topicArn,
            },
          ],
        },
      ],
    });
  }
}
