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
import { getPythonUvDockerImage, PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { LAMBDA_DIR, LAYERS_DIR } from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { camelCaseToKebabCase, camelCaseToSnakeCase } from '../utils';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { WorkflowNameType } from '../interfaces';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';

export function buildAnalysisToolsLayer(scope: Construct): PythonLayerVersion {
  /**
   Builds the analysis tools layer, which provides common functions used throughout the lambdas
   */
  return new PythonLayerVersion(scope, 'analysis-lambda-layer', {
    entry: path.join(LAYERS_DIR, 'analysis_tool_kit'),
    compatibleRuntimes: [lambda.Runtime.PYTHON_3_14],
    compatibleArchitectures: [lambda.Architecture.ARM_64],
    bundling: {
      image: getPythonUvDockerImage(),
      commandHooks: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [];
        },
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [
            `pip install ${inputDir} --target ${outputDir}`,
            // Delete the tests directory from pandas
            `rm -rf ${outputDir}/pandas/tests`,
            // Delete the *pyc files and __pycache__ directories
            `find ${outputDir} -type f -name '*.pyc' -delete`,
            // Delete the __pycache__ directories contents
            `find ${outputDir} -type d -name '__pycache__' -exec rm -rf {}/* \\;`,
            // Delete the __pycache__ directories themselves
            `find ${outputDir} -type d -name '__pycache__' -delete`,
          ];
        },
      },
    },
  });
}

function buildLambda(scope: Construct, props: BuildLambdaProps): LambdaObject {
  const lambdaNameToSnakeCase = camelCaseToSnakeCase(props.lambdaName);
  const lambdaRequirements = lambdaRequirementsMap[props.lambdaName];

  // Create the lambda function
  const lambdaFunction = new PythonUvFunction(scope, props.lambdaName, {
    entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
    runtime: lambda.Runtime.PYTHON_3_14,
    architecture: lambda.Architecture.ARM_64,
    index: lambdaNameToSnakeCase + '.py',
    handler: 'handler',
    timeout: Duration.seconds(300),
    includeOrcabusApiToolsLayer: lambdaRequirements.needsOrcabusApiTools,
  });

  // AwsSolutions-IAM4 - We need to add this for the lambda to work
  NagSuppressions.addResourceSuppressions(
    lambdaFunction,
    [
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

  if (lambdaRequirements.needsAnalysisToolsLayer) {
    /* Add the analysis tools layer */
    lambdaFunction.addLayers(props.analysisToolsLayer);
  }

  // BCLConvert Interop QC
  if (props.lambdaName === 'makeBclconvertInteropQcEvent') {
    lambdaFunction.addEnvironment(
      'BCLCONVERT_INTEROP_QC_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'bclconvertInteropQc')
      )
    );

    lambdaFunction.addEnvironment(
      'BCLCONVERT_INTEROP_QC_PAYLOAD_VERSION_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.payloadVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'bclconvertInteropQc')
      )
    );
  }

  // ctDNA
  if (props.lambdaName === 'makeCtdnaAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_TSO500_CTDNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenTso500Ctdna')
      )
    );
  }

  if (props.lambdaName === 'makeCtdnaPostAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'PIERIANDX_TSO500_CTDNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'pieriandxTso500Ctdna')
      )
    );
  }

  // DNA
  if (props.lambdaName === 'makeWgsAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_WGTS_DNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenWgtsDna')
      )
    );
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_DNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsDna')
      )
    );
    lambdaFunction.addEnvironment(
      'SASH_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'sash')
      )
    );
  }

  // RNA
  if (props.lambdaName === 'makeWtsAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'DRAGEN_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'dragenWgtsRna')
      )
    );
    lambdaFunction.addEnvironment(
      'ARRIBA_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'arribaWgtsRna')
      )
    );
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsRna')
      )
    );
  }

  // DNA/RNA
  if (props.lambdaName === 'makeWgtsPostAnalysisEventsList') {
    lambdaFunction.addEnvironment(
      'ONCOANALYSER_WGTS_DNA_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
      path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(<WorkflowNameType>'oncoanalyserWgtsDnaRna')
      )
    );
    lambdaFunction.addEnvironment(
      'RNASUM_WORKFLOW_OBJECT_SSM_PARAMETER_NAME',
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
