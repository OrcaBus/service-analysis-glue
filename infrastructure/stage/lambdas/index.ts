/*
Build out the lambda functions

We have the following environment variables to set (per function)


 */

import {
  BuildAllLambdasProps,
  BuildLambdaProps,
  lambdaNameList,
  LambdaObject,
  lambdaRequirementsMap,
} from './interfaces';
import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { LAMBDA_DIR } from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { camelCaseToKebabCase, camelCaseToSnakeCase } from '../utils';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { WorkflowNameType } from '../interfaces';

function buildLambda(scope: Construct, props: BuildLambdaProps): LambdaObject {
  const lambdaNameToSnakeCase = camelCaseToSnakeCase(props.lambdaName);
  const lambdaRequirements = lambdaRequirementsMap[props.lambdaName];

  // Create the lambda function
  const lambdaFunction = new PythonUvFunction(scope, props.lambdaName, {
    entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
    runtime: lambda.Runtime.PYTHON_3_12,
    architecture: lambda.Architecture.ARM_64,
    index: lambdaNameToSnakeCase + '.py',
    handler: 'handler',
    timeout: Duration.seconds(300),
    includeOrcabusApiToolsLayer: lambdaRequirements.needsOrcabusApiTools,
  });

  // AwsSolutions-L1 - We'll migrate to PYTHON_3_13 ASAP, soz
  // AwsSolutions-IAM4 - We need to add this for the lambda to work
  NagSuppressions.addResourceSuppressions(
    lambdaFunction,
    [
      {
        id: 'AwsSolutions-L1',
        reason: 'Will migrate to PYTHON_3_13 ASAP, soz',
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'We use the basic execution role for lambda functions',
      },
    ],
    true
  );

  /*
    Add in SSM permissions for the lambda function
    */
  if (lambdaRequirements.needsSsmParameterAccess) {
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${path.join(props.ssmParameterPaths.rootPrefix, '/*')}`,
        ],
      })
    );
    /* Since we dont ask which schema, we give the lambda access to all ssm parameters */
    /* As such we need to add the wildcard to the resource */
    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'We need to give the lambda access to all ssm parameters',
        },
      ],
      true
    );
  }

  // ctDNA
  if (props.lambdaName === 'makeCtdnaAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_TSO500_CTDNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenTso500Ctdna')
      )
    );
  }

  if (props.lambdaName === 'makeCtdnaPostAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'PIERIANDX_TSO500_CTDNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'pieriandxTso500Ctdna')
      )
    );
  }

  // DNA
  if (props.lambdaName === 'makeWgsAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_WGTS_DNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenWgtsDna')
      )
    );
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_DNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsDna')
      )
    );
    lambdaFunction.addEnvironment(
      'SASH_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'sash')
      )
    );
  }

  // RNA
  if (props.lambdaName === 'makeWtsAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenWgtsRna')
      )
    );
    lambdaFunction.addEnvironment(
      'ARRIBA_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'arribaWgtsRna')
      )
    );
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsRna')
      )
    );
  }

  // DNA/RNA
  if (props.lambdaName === 'makeWgtsPostAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_DNA_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsDnaRna')
      )
    );
    lambdaFunction.addEnvironment(
      'RNASUM_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'rnasum')
      )
    );
  }

  /* Return the function */
  return {
    lambdaName: props.lambdaName,
    lambdaFunction: lambdaFunction,
  };
}

export function buildAllLambdas(scope: Construct, props: BuildAllLambdasProps): LambdaObject[] {
  // Iterate over lambdaLayerToMapping and create the lambda functions
  const lambdaObjects: LambdaObject[] = [];
  for (const lambdaName of lambdaNameList) {
    lambdaObjects.push(
      buildLambda(scope, {
        lambdaName: lambdaName,
        ...props,
      })
    );
  }

  return lambdaObjects;
}
