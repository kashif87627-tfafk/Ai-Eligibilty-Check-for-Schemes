import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { EligibilityMvpStack } from './eligibility-mvp-stack';

describe('EligibilityMvpStack CloudWatch Monitoring', () => {
  let app: cdk.App;
  let stack: EligibilityMvpStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new EligibilityMvpStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'ap-south-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('CloudWatch Dashboard', () => {
    it('should create a CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Eligibility-MVP-Dashboard',
      });
    });

    it('should include dashboard body with widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardKeys = Object.keys(dashboards);
      
      expect(dashboardKeys.length).toBeGreaterThan(0);
      
      // Dashboard body is a CloudFormation intrinsic function, so we just verify it exists
      const dashboard = dashboards[dashboardKeys[0]];
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('SNS Topic for Alarms', () => {
    it('should create SNS topic for alarm notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'eligibility-mvp-alarms',
        DisplayName: 'Eligibility MVP Alarms',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create high error rate alarm (>5%)', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-High-Error-Rate',
        AlarmDescription: 'Alert when API error rate exceeds 5%',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    it('should create high latency alarm (>5s)', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-High-Latency',
        AlarmDescription: 'Alert when API latency exceeds 5 seconds',
        Threshold: 5000,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    it('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-Lambda-Errors',
        AlarmDescription: 'Alert when Lambda function has errors',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    it('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-Lambda-Throttles',
        AlarmDescription: 'Alert when Lambda function is throttled',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    it('should create high Bedrock calls alarm for cost control', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-High-Bedrock-Calls',
        AlarmDescription: Match.stringLikeRegexp('.*cost control.*'),
        Threshold: 100,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    it('should create high Bedrock tokens alarm for cost control', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-High-Bedrock-Tokens',
        AlarmDescription: Match.stringLikeRegexp('.*cost control.*'),
        Threshold: 50000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    it('should create low cache hit rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Eligibility-MVP-Low-Cache-Hit-Rate',
        AlarmDescription: 'Alert when cache hit rate is below 50%',
        Threshold: 50,
        ComparisonOperator: 'LessThanThreshold',
      });
    });

    it('should configure all alarms to send notifications to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmCount = Object.keys(alarms).length;
      
      // Should have 7 alarms total
      expect(alarmCount).toBe(7);

      // Each alarm should have an AlarmActions property
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should export alarm topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS Topic ARN for CloudWatch Alarms',
        Export: {
          Name: 'EligibilityMvpAlarmTopicArn',
        },
      });
    });
  });

  describe('Alarm Configuration', () => {
    it('should treat missing data as not breaching for all alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });

    it('should use appropriate evaluation periods', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      
      Object.values(alarms).forEach((alarm: any) => {
        const evaluationPeriods = alarm.Properties.EvaluationPeriods;
        expect(evaluationPeriods).toBeGreaterThanOrEqual(1);
        expect(evaluationPeriods).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Cost Optimization Measures', () => {
    it('should configure DynamoDB with on-demand billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('should configure CloudWatch log retention to 7 days', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    it('should create API Gateway usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: 'Eligibility-MVP-Usage-Plan',
        Description: 'Usage plan with rate limiting for cost control',
        Throttle: {
          RateLimit: 10,
          BurstLimit: 20,
        },
        Quota: {
          Limit: 10000,
          Period: 'MONTH',
        },
      });
    });

    it('should create API key for usage tracking', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: 'eligibility-mvp-api-key',
        Description: 'API Key for Eligibility MVP',
        Enabled: true,
      });
    });

    it('should create AWS Budget alert at ₹1,000 (~$12)', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'Eligibility-MVP-Budget-1000-INR',
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          BudgetLimit: {
            Amount: 12,
            Unit: 'USD',
          },
        },
      });
    });

    it('should create AWS Budget alert at ₹3,000 (~$36)', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'Eligibility-MVP-Budget-3000-INR',
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          BudgetLimit: {
            Amount: 36,
            Unit: 'USD',
          },
        },
      });
    });

    it('should create AWS Budget alert at ₹5,000 (~$60)', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'Eligibility-MVP-Budget-5000-INR',
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          BudgetLimit: {
            Amount: 60,
            Unit: 'USD',
          },
        },
      });
    });

    it('should configure budget alerts at 80% and 100% thresholds', () => {
      const budgets = template.findResources('AWS::Budgets::Budget');
      
      Object.values(budgets).forEach((budget: any) => {
        const notifications = budget.Properties.NotificationsWithSubscribers;
        expect(notifications).toHaveLength(2);
        
        // Check for 80% threshold
        const threshold80 = notifications.find((n: any) => n.Notification.Threshold === 80);
        expect(threshold80).toBeDefined();
        expect(threshold80.Notification.ComparisonOperator).toBe('GREATER_THAN');
        expect(threshold80.Notification.ThresholdType).toBe('PERCENTAGE');
        
        // Check for 100% threshold
        const threshold100 = notifications.find((n: any) => n.Notification.Threshold === 100);
        expect(threshold100).toBeDefined();
        expect(threshold100.Notification.ComparisonOperator).toBe('GREATER_THAN');
        expect(threshold100.Notification.ThresholdType).toBe('PERCENTAGE');
      });
    });

    it('should send budget alerts to SNS topic', () => {
      const budgets = template.findResources('AWS::Budgets::Budget');
      
      Object.values(budgets).forEach((budget: any) => {
        const notifications = budget.Properties.NotificationsWithSubscribers;
        notifications.forEach((notification: any) => {
          expect(notification.Subscribers).toHaveLength(1);
          expect(notification.Subscribers[0].SubscriptionType).toBe('SNS');
        });
      });
    });
  });
});
