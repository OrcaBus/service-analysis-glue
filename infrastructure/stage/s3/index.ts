import * as s3 from 'aws-cdk-lib/aws-s3';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

function createS3Bucket(scope: Construct, bucketName: string): Bucket {
  // Create the glue artefacts bucket
  return new s3.Bucket(scope, 'analysis-glue-artifacts-bucket', {
    bucketName: bucketName,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.RETAIN,
  });
}

export function buildAnalysisGlueArtifactsBucket(scope: Construct, bucketName: string): Bucket {
  return createS3Bucket(scope, bucketName);
}
