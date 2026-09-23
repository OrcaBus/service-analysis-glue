import { IEventBus } from 'aws-cdk-lib/aws-events';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

import { SsmParameterPaths } from '../ssm/interfaces';
import { LambdaName, LambdaObject } from '../lambdas/interfaces';

/**
 * Step Function Interfaces
 */
export type StateMachineName =
  // Analysis Builders
  | 'wgtsAnalysisBuilder'
  | 'cttsoAnalysisBuilder'
  | 'bclconvertInteropQcAnalysisBuilder'
  // Validation Builder
  | 'runPreflightChecks';

export const stateMachineNameList: StateMachineName[] = [
  // Analysis Builders
  'wgtsAnalysisBuilder',
  'cttsoAnalysisBuilder',
  'bclconvertInteropQcAnalysisBuilder',
  // Validation Builder
  'runPreflightChecks',
];

// Requirements interface for Step Functions
export interface StepFunctionRequirements {
  // SFN stuff
  needsDistributedMapPermission?: boolean;
  // Event stuff
  needsEventPutPermission?: boolean;
  // SSM Stuff
  needsSsmParameterAccess?: boolean;
  // Grants scheduler:GetSchedule + scheduler:UpdateSchedule on the preflight schedule
  needsSchedulerSelfDisablePermission?: boolean;
  // SFN Account Specific?
  prodOnly?: boolean;
}

export interface StepFunctionInput {
  stateMachineName: StateMachineName;
}

export interface BuildStepFunctionProps extends StepFunctionInput {
  lambdaObjects: LambdaObject[];
  eventBus: IEventBus;
  ssmParameterPaths: SsmParameterPaths;
  isProdAccount: boolean;
}

export interface StepFunctionObject extends StepFunctionInput {
  sfnObject: StateMachine;
}

export type WireUpPermissionsProps = BuildStepFunctionProps & StepFunctionObject;

export type BuildStepFunctionsProps = Omit<BuildStepFunctionProps, 'stateMachineName'>;

export const stepFunctionsRequirementsMap: Record<StateMachineName, StepFunctionRequirements> = {
  wgtsAnalysisBuilder: {
    needsEventPutPermission: true,
    needsDistributedMapPermission: true,
  },
  cttsoAnalysisBuilder: {
    needsEventPutPermission: true,
    needsDistributedMapPermission: true,
  },
  bclconvertInteropQcAnalysisBuilder: {
    needsEventPutPermission: true,
  },
  runPreflightChecks: {
    needsEventPutPermission: true,
    needsSsmParameterAccess: true,
    needsSchedulerSelfDisablePermission: true,
    prodOnly: true,
  },
};

export const stepFunctionToLambdasMap: Record<StateMachineName, LambdaName[]> = {
  wgtsAnalysisBuilder: [
    // Metadata gatherers
    'getSubjectsFromInstrumentRunId',
    'getLibrariesFromInstrumentRunIdAndSubjectId',
    // Event Detail Makers
    'makeWgsAnalysisEventsList',
    'makeWtsAnalysisEventsList',
    // Post Event Detail Makers
    'makeWgtsPostAnalysisEventsList',
    // Case pairing
    'pairCasesWithLibraries',
  ],
  cttsoAnalysisBuilder: [
    // Metadata gatherers
    'getSubjectsFromInstrumentRunId',
    'getLibrariesFromInstrumentRunIdAndSubjectId',
    // Event Detail Makers
    'makeCtdnaAnalysisEventsList',
    // Post Event Detail Makers
    'makeCtdnaPostAnalysisEventsList',
    // Case pairing
    'pairCasesWithLibraries',
  ],
  bclconvertInteropQcAnalysisBuilder: [
    // Event Detail Makers
    'makeBclconvertInteropQcEvent',
  ],
  runPreflightChecks: [
    // Build up the current status manager state
    'getDeploymentStatusManagerState',
    // Generate the validation event drafts
    'generateCtdnaValidationEvent',
    'generatePieriandxValidationEvent',
    'generateDragenWgtsDnaValidationEvent',
    'generateOncoanalyserWgtsDnaValidationEvent',
    'generateSashValidationEvent',
    'generateDragenWgtsRnaValidationEvent',
    'generateArribaWgtsRnaValidationEvent',
    'generateOncoanalyserWgtsRnaValidationEvent',
    'generateOncoanalyserWgtsDnaRnaValidationEvent',
    'generateRnasumValidationEvent',
    // Summarise the changes in comments to the workflow manager
    'summariseDeployStatusManagerChanges',
  ],
};
