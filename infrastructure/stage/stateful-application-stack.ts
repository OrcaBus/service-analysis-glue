import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GitStack } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { StatefulApplicationStackConfig } from './interfaces';
import { buildSsmParameters } from './ssm';
import { buildAnalysisGlueArtifactsBucket } from './s3';

export type StatefulApplicationStackProps = StatefulApplicationStackConfig & cdk.StackProps;

export class StatefulApplicationStack extends GitStack {
  constructor(scope: Construct, id: string, props: StatefulApplicationStackProps) {
    super(scope, id, props);

    // Build SSM Parameters
    buildSsmParameters(this, {
      ssmParameterPaths: props.ssmParameterPaths,
      ssmParameterValues: props.ssmParameterValues,
    });

    // Only if stageName is prod
    if (props.stageName === 'PROD') {
      // S3 Bucket
      buildAnalysisGlueArtifactsBucket(this, <string>props.analysisGlueArtefactsBucketName);
    }
  }
}
