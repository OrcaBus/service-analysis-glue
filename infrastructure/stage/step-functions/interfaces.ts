import { IEventBus } from 'aws-cdk-lib/aws-events';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

import { SsmParameterPaths } from '../ssm/interfaces';
import { LambdaName, LambdaObject } from '../lambdas/interfaces';

/**
 * Step Function Interfaces
 */
export type StateMachineName =
  // Analysis Builder
  'analysisBuilder';

export const stateMachineNameList: StateMachineName[] = [
  // Analysis Builder
  'analysisBuilder',
];

// Requirements interface for Step Functions
export interface StepFunctionRequirements {
  // SFN stuff
  needsDistributedMapPermission?: boolean;
  // Event stuff
  needsEventPutPermission?: boolean;
}

export interface StepFunctionInput {
  stateMachineName: StateMachineName;
}

export interface BuildStepFunctionProps extends StepFunctionInput {
  lambdaObjects: LambdaObject[];
  eventBus: IEventBus;
  ssmParameterPaths: SsmParameterPaths;
  isNewWorkflowManagerDeployed: boolean;
}

export interface StepFunctionObject extends StepFunctionInput {
  sfnObject: StateMachine;
}

export type WireUpPermissionsProps = BuildStepFunctionProps & StepFunctionObject;

export type BuildStepFunctionsProps = Omit<BuildStepFunctionProps, 'stateMachineName'>;

export const stepFunctionsRequirementsMap: Record<StateMachineName, StepFunctionRequirements> = {
  analysisBuilder: {
    needsEventPutPermission: true,
    needsDistributedMapPermission: true,
  },
};

export const stepFunctionToLambdasMap: Record<StateMachineName, LambdaName[]> = {
  analysisBuilder: [
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
  ],
};
