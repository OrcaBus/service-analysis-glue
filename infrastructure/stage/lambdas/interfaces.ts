/*
Get the list of libraries
*/

import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { SsmParameterPaths } from '../ssm/interfaces';

export type LambdaName =
  // Metadata gatherers
  | 'getLibrariesFromInstrumentRunIdAndSubjectId'
  | 'getSubjectsFromInstrumentRunId'
  // Event Detail Makers
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
  makeCtdnaAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  makeWgsAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  makeWtsAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  // Post Event Detail Makers
  makeCtdnaPostAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
  makeWgtsPostAnalysisEventsList: {
    needsOrcabusApiTools: true,
    needsSsmParameterAccess: true,
  },
};

export interface BuildAllLambdasProps {
  ssmParameterPaths: SsmParameterPaths;
}

export interface BuildLambdaProps extends BuildAllLambdasProps {
  lambdaName: LambdaName;
}

export interface LambdaObject {
  lambdaName: LambdaName;
  lambdaFunction: PythonUvFunction;
}
