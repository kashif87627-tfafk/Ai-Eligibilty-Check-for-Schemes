#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EligibilityMvpStack } from '../lib/eligibility-mvp-stack';

const app = new cdk.App();

new EligibilityMvpStack(app, 'EligibilityMvpStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  description: 'Eligibility-First Community Access Platform MVP Infrastructure',
});

app.synth();
