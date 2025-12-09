/** Step Function stuff */
import {
  BuildStepFunctionProps,
  BuildStepFunctionsProps,
  stateMachineNameList,
  StepFunctionObject,
  stepFunctionsRequirementsMap,
  stepFunctionToLambdasMap,
  WireUpPermissionsProps,
} from './interfaces';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import path from 'path';
import {
  EVENT_SOURCE,
  STACK_PREFIX,
  STEP_FUNCTIONS_DIR,
  WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE,
  WORKFLOW_RUN_UPDATE_DETAIL_TYPE,
} from '../constants';
import { Construct } from 'constructs';
import { camelCaseToSnakeCase } from '../utils';
import { MetadataSampleTypeBySampleType } from '../interfaces';

function createStateMachineDefinitionSubstitutions(props: BuildStepFunctionProps): {
  [key: string]: string;
} {
  const definitionSubstitutions: { [key: string]: string } = {};

  const sfnRequirements = stepFunctionsRequirementsMap[props.stateMachineName];
  const lambdaFunctionNamesInSfn = stepFunctionToLambdasMap[props.stateMachineName];
  const lambdaFunctions = props.lambdaObjects.filter((lambdaObject) =>
    lambdaFunctionNamesInSfn.includes(lambdaObject.lambdaName)
  );

  /* Substitute lambdas in the state machine definition */
  for (const lambdaObject of lambdaFunctions) {
    const sfnSubtitutionKey = `__${camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
    definitionSubstitutions[sfnSubtitutionKey] =
      // Anti-pattern compared to other step functions we create
      // However we may want to redrive after updating the function, so we need to use the alias $LATEST
      lambdaObject.lambdaFunction.latestVersion.functionArn;
  }

  /* Some standard substitutions */
  definitionSubstitutions['__wgs_sample_type__'] = MetadataSampleTypeBySampleType['DNA'];
  definitionSubstitutions['__wts_sample_type__'] = MetadataSampleTypeBySampleType['RNA'];
  definitionSubstitutions['__ctdna_sample_type__'] = MetadataSampleTypeBySampleType['ctDNA'];

  /* Sfn Requirements */
  if (sfnRequirements.needsEventPutPermission) {
    definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;
    definitionSubstitutions['__workflow_run_state_change_detail_type__'] =
      WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE;
    definitionSubstitutions['__workflow_run_update_detail_type__'] =
      `${WORKFLOW_RUN_UPDATE_DETAIL_TYPE}`;
    definitionSubstitutions['__stack_source__'] = EVENT_SOURCE;
  }

  return definitionSubstitutions;
}

function wireUpStateMachinePermissions(scope: Construct, props: WireUpPermissionsProps): void {
  /* Wire up lambda permissions */
  const sfnRequirements = stepFunctionsRequirementsMap[props.stateMachineName];

  const lambdaFunctionNamesInSfn = stepFunctionToLambdasMap[props.stateMachineName];
  const lambdaFunctions = props.lambdaObjects.filter((lambdaObject) =>
    lambdaFunctionNamesInSfn.includes(lambdaObject.lambdaName)
  );

  /* Allow the state machine to invoke the lambda function */
  for (const lambdaObject of lambdaFunctions) {
    // Anti-pattern compared to other step functions we create
    // Usually grant invoke on the versioned function, however we may want to redrive
    // after updating the function, so we need to grant on the alias
    lambdaObject.lambdaFunction.grantInvoke(props.sfnObject);

    /* Nag Suppressions */
    /* AwsSolutions-IAM-5 - We also don't need X-Ray tracing */
    NagSuppressions.addResourceSuppressions(
      props.sfnObject,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'Lambda invoke permissions are intentionally broad to allow for redrive scenarios',
        },
      ],
      true
    );
  }

  if (sfnRequirements.needsEventPutPermission) {
    props.eventBus.grantPutEventsTo(props.sfnObject);
  }

  /* Check if the state machine needs the abilty to start / monitor distributed maps */
  if (sfnRequirements.needsDistributedMapPermission) {
    // Because this steps execution uses a distributed map in its step function, we
    // have to wire up some extra permissions
    // Grant the state machine's role to execute itself
    // However we cannot just grant permission to the role as this will result in a circular dependency
    // between the state machine and the role
    // Instead we use the workaround here - https://github.com/aws/aws-cdk/issues/28820#issuecomment-1936010520
    const distributedMapPolicy = new iam.Policy(
      scope,
      `${props.stateMachineName}-distributed-map-policy`,
      {
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [props.sfnObject.stateMachineArn],
              actions: ['states:StartExecution'],
            }),
            new iam.PolicyStatement({
              resources: [
                `arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:execution:${props.sfnObject.stateMachineName}/*:*`,
              ],
              actions: [
                'states:RedriveExecution',
                'states:AbortExecution',
                'states:DescribeExecution',
              ],
            }),
          ],
        }),
      }
    );
    // Add the policy to the state machine role
    props.sfnObject.role.attachInlinePolicy(distributedMapPolicy);

    // Add Nag suppressions
    NagSuppressions.addResourceSuppressions(
      [props.sfnObject, distributedMapPolicy],
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'This policy is required to allow the state machine to start executions of itself and monitor them. ' +
            'It is not possible to scope this down further without causing circular dependencies.',
        },
      ]
    );
  }
}

function buildStepFunction(scope: Construct, props: BuildStepFunctionProps): StepFunctionObject {
  const sfnNameToSnakeCase = camelCaseToSnakeCase(props.stateMachineName);

  /* Create the state machine definition substitutions */
  const stateMachine = new sfn.StateMachine(scope, props.stateMachineName, {
    stateMachineName: `${STACK_PREFIX}-${props.stateMachineName}`,
    definitionBody: sfn.DefinitionBody.fromFile(
      path.join(STEP_FUNCTIONS_DIR, sfnNameToSnakeCase + `_sfn_template.asl.json`)
    ),
    definitionSubstitutions: createStateMachineDefinitionSubstitutions(props),
  });

  /* Grant the state machine permissions */
  wireUpStateMachinePermissions(scope, {
    sfnObject: stateMachine,
    ...props,
  });

  /* Nag Suppressions */
  /* AwsSolutions-SF1 - We don't need ALL events to be logged */
  /* AwsSolutions-SF2 - We also don't need X-Ray tracing */
  NagSuppressions.addResourceSuppressions(
    stateMachine,
    [
      {
        id: 'AwsSolutions-SF1',
        reason: 'We do not need all events to be logged',
      },
      {
        id: 'AwsSolutions-SF2',
        reason: 'We do not need X-Ray tracing',
      },
    ],
    true
  );

  /* Return as a state machine object property */
  return {
    ...props,
    sfnObject: stateMachine,
  };
}

export function buildAllStepFunctions(
  scope: Construct,
  props: BuildStepFunctionsProps
): StepFunctionObject[] {
  const stepFunctionObjects: StepFunctionObject[] = [];

  for (const stepFunctionName of stateMachineNameList) {
    stepFunctionObjects.push(
      buildStepFunction(scope, {
        stateMachineName: stepFunctionName,
        lambdaObjects: props.lambdaObjects,
        eventBus: props.eventBus,
        ssmParameterPaths: props.ssmParameterPaths,
      })
    );
  }

  return stepFunctionObjects;
}
