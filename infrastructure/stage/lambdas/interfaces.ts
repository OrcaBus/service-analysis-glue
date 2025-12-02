/*
Get the list of libraries
*/

import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { SsmParameterPaths } from '../ssm/interfaces';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';

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
  | 'makeWgtsPostAnalysisEventsList';

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
];

// Requirements interface for Lambda functions
export interface LambdaRequirements {
  needsOrcabusApiTools?: boolean;
  needsSsmParameterAccess?: boolean;
  needsAnalysisToolsLayer?: boolean;
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
  },
};

export interface BuildAllLambdasProps {
  /* Custom layers */
  analysisToolsLayer: PythonLayerVersion;
  /* SSM Parameters */
  ssmParameterPaths: SsmParameterPaths;
}

export interface BuildLambdaProps extends BuildAllLambdasProps {
  lambdaName: LambdaName;
}

export interface LambdaObject {
  lambdaName: LambdaName;
  lambdaFunction: PythonUvFunction;
}
