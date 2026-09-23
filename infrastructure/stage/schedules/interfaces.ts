import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler';

import { StepFunctionObject } from '../step-functions/interfaces';

/**
 * Schedule Interfaces
 */
export type ScheduleName = 'runPreflightChecksSchedule';

export const scheduleNameList: ScheduleName[] = ['runPreflightChecksSchedule'];

export interface BuildSchedulesProps {
  // Target state machines produced by buildAllStepFunctions
  stepFunctionObjects: StepFunctionObject[];
  // Prod-only gating, matching the rest of the stack
  isProdAccount: boolean;
}

export interface ScheduleObject {
  scheduleName: ScheduleName;
  scheduleObject: CfnSchedule;
}
