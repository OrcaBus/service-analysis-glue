/*
Get the list of libraries
*/

import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { SsmParameterPaths } from '../ssm/interfaces';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export type LambdaName =
  // Metadata gatherers
  | 'getLibrariesFromInstrumentRunIdAndSubjectId'
  | 'getSubjectsFromInstrumentRunId'
  // Event Detail Makers
  | 'makeBclconvertInteropQcEvent'
  | 'makeCtdnaAnalysisEventsList'
  | 'makeWgsAnalysisEventsList'
  | 'makeWtsAnalysisEventsList'
  // Post Event Detail Makers
  | 'makeCtdnaPostAnalysisEventsList'
  | 'makeWgtsPostAnalysisEventsList'
  // Validation Makers
  | 'getDeploymentStatusManagerState'
  | 'generateCtdnaValidationEvent'
  | 'generateDragenWgtsDnaValidationEvent'
  | 'generateOncoanalyserWgtsDnaValidationEvent'
  | 'generateSashValidationEvent'
  | 'summariseDeployStatusManagerChanges';

export const lambdaNameList: LambdaName[] = [
  // Metadata gatherers
  'getLibrariesFromInstrumentRunIdAndSubjectId',
  'getSubjectsFromInstrumentRunId',
  // Event Detail Makers
  'makeBclconvertInteropQcEvent',
  'makeCtdnaAnalysisEventsList',
  'makeWgsAnalysisEventsList',
  'makeWtsAnalysisEventsList',
  // Post Event Detail Makers
  'makeCtdnaPostAnalysisEventsList',
  'makeWgtsPostAnalysisEventsList',
  // Validation Makers
  'getDeploymentStatusManagerState',
  'generateCtdnaValidationEvent',
  'generateDragenWgtsDnaValidationEvent',
  'generateOncoanalyserWgtsDnaValidationEvent',
  'generateSashValidationEvent',
  'summariseDeployStatusManagerChanges',
];

// Requirements interface for Lambda functions
export interface LambdaRequirements {
  needsOrcabusApiTools?: boolean;
  needsSsmParameterAccess?: boolean;
  needsAnalysisToolsLayer?: boolean;
  needsLongerTimeout?: boolean;
  needsMoreMemory?: boolean;
  needsS3Permissions?: boolean;
  prodOnly?: boolean;
}

// Lambda requirements mapping
export const lambdaRequirementsMap: Record<LambdaName, LambdaRequirements> = {
  // Metadata gatherers
  getLibrariesFromInstrumentRunIdAndSubjectId: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  getSubjectsFromInstrumentRunId: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  // Event Detail Makers
  makeBclconvertInteropQcEvent: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
    needsLongerTimeout: true,
    needsMoreMemory: true,
  },
  makeCtdnaAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
  },
  makeWgsAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
    needsLongerTimeout: true,
    needsMoreMemory: true,
  },
  makeWtsAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
  },
  // Post Event Detail Makers
  makeCtdnaPostAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
  },
  makeWgtsPostAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsAnalysisToolsLayer: true,
    needsLongerTimeout: true,
    needsMoreMemory: true,
  },
  // Validation Events
  getDeploymentStatusManagerState: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsS3Permissions: true,
    prodOnly: true,
  },
  generateCtdnaValidationEvent: {
    needsOrcabusApiTools: true,
    needsAnalysisToolsLayer: true,
    needsSsmParameterAccess: true,
    prodOnly: true,
  },
  generateDragenWgtsDnaValidationEvent: {
    needsOrcabusApiTools: true,
    needsAnalysisToolsLayer: true,
    needsSsmParameterAccess: true,
    prodOnly: true,
  },
  generateOncoanalyserWgtsDnaValidationEvent: {
    needsOrcabusApiTools: true,
    needsAnalysisToolsLayer: true,
    needsSsmParameterAccess: true,
    prodOnly: true,
  },
  generateSashValidationEvent: {
    needsOrcabusApiTools: true,
    needsAnalysisToolsLayer: true,
    needsSsmParameterAccess: true,
    prodOnly: true,
  },
  summariseDeployStatusManagerChanges: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
    needsS3Permissions: true,
    prodOnly: true,
  },
};

export interface BuildAllLambdasProps {
  /* Custom layers */
  analysisToolsLayer: PythonLayerVersion;
  /* SSM Parameters */
  ssmParameterPaths: SsmParameterPaths;
  /* S3 Bucket */
  s3ArtefactsBucket?: IBucket;
  /* Is Prod Account */
  isProdAccount: boolean;
}

export interface BuildLambdaProps extends BuildAllLambdasProps {
  lambdaName: LambdaName;
}

export interface LambdaObject {
  lambdaName: LambdaName;
  lambdaFunction: PythonUvFunction;
}
