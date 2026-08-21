import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import { GitStack } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { buildAllStepFunctions } from './step-functions';
import { StatelessApplicationStackConfig } from './interfaces';
import { buildAllEventRules } from './event-rules';
import { buildAllEventBridgeTargets } from './event-targets';
import { buildAllLambdas, buildAnalysisToolsLayer } from './lambdas';

export type StatelessApplicationStackProps = cdk.StackProps & StatelessApplicationStackConfig;

export class StatelessApplicationStack extends GitStack {
  constructor(scope: Construct, id: string, props: StatelessApplicationStackProps) {
    super(scope, id, props);

    /**
     * Analysis Glue Stack
     */
    // Get the event bus as a construct
    const orcabusMainEventBus = events.EventBus.fromEventBusName(
      this,
      props.eventBusName,
      props.eventBusName
    );

    // Get the S3 Bucket
    const analysisGlueArtifactsBucket = props.analysisGlueArtefactsBucketName
      ? s3.Bucket.fromBucketName(
          this,
          'AnalysisGlueArtifactsBucket',
          props.analysisGlueArtefactsBucketName
        )
      : undefined;

    // Build analysis Tools Layer
    const analysisToolsLayer = buildAnalysisToolsLayer(this);

    // Build the lambdas
    const lambdas = buildAllLambdas(this, {
      analysisToolsLayer: analysisToolsLayer,
      ssmParameterPaths: props.ssmParameterPaths,
      s3ArtefactsBucket: analysisGlueArtifactsBucket,
      isProdAccount: props.stageName === 'PROD',
    });

    // Build the state machines
    const stateMachines = buildAllStepFunctions(this, {
      lambdaObjects: lambdas,
      eventBus: orcabusMainEventBus,
      ssmParameterPaths: props.ssmParameterPaths,
      isProdAccount: props.stageName === 'PROD',
    });

    // Add event rules
    const eventRules = buildAllEventRules(this, {
      eventBus: orcabusMainEventBus,
    });

    // Add event targets
    buildAllEventBridgeTargets({
      eventBridgeRuleObjects: eventRules,
      stepFunctionObjects: stateMachines,
    });
  }
}
