import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

import { STACK_PREFIX } from '../constants';
import { BuildSchedulesProps, ScheduleObject, scheduleNameList } from './interfaces';

/**
 * Scheduler execution IAM role.
 *
 * EventBridge Scheduler assumes this role to invoke the target. It needs only
 * `states:StartExecution` on the preflight state machine.
 */
function buildSchedulerExecutionRole(scope: Construct, stateMachine: StateMachine): iam.Role {
  const role = new iam.Role(scope, 'runPreflightChecksScheduleRole', {
    assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    description: 'Execution role for the weekly preflight-checks schedule',
  });

  role.addToPolicy(
    new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [stateMachine.stateMachineArn], // scoped to the one SM
    })
  );

  return role;
}

/**
 * Build the weekly preflight-checks schedule.
 *
 * Fires Friday 15:00 Melbourne local time (DST-aware) and starts an execution
 * of the preflight state machine. Created enabled; the state machine disables
 * it on the first run.
 */
function buildPreflightSchedule(scope: Construct, stateMachine: StateMachine): CfnSchedule {
  const schedulerRole = buildSchedulerExecutionRole(scope, stateMachine);

  return new scheduler.CfnSchedule(scope, 'runPreflightChecksSchedule', {
    name: `${STACK_PREFIX}-run-preflight-checks-schedule`,
    // Friday 15:00
    scheduleExpression: 'cron(0 15 ? * FRI *)',
    // Melbourne local time, DST-aware
    scheduleExpressionTimezone: 'Australia/Melbourne',
    // No flexibility - exact fire time
    flexibleTimeWindow: { mode: 'OFF' },
    // Created enabled; the state machine disables it on first run
    state: 'ENABLED',
    target: {
      arn: stateMachine.stateMachineArn, // invoke the preflight SM
      roleArn: schedulerRole.roleArn,
      input: JSON.stringify({}),
    },
  });
}

export function buildAllSchedules(scope: Construct, props: BuildSchedulesProps): ScheduleObject[] {
  const scheduleObjects: ScheduleObject[] = [];

  // Prod-only: omit entirely outside the production account
  if (!props.isProdAccount) {
    return scheduleObjects;
  }

  for (const scheduleName of scheduleNameList) {
    switch (scheduleName) {
      case 'runPreflightChecksSchedule': {
        const stateMachine = props.stepFunctionObjects.find(
          (sfn) => sfn.stateMachineName === 'runPreflightChecks'
        )?.sfnObject;
        // Guard against a missing target: .find(...)?.sfnObject is StateMachine | undefined,
        // but buildPreflightSchedule requires StateMachine. Fail loudly at synth so this
        // compiles and surfaces a clear error rather than a downstream type/runtime failure.
        if (!stateMachine) {
          throw new Error(
            "Cannot build runPreflightChecksSchedule: 'runPreflightChecks' state machine not found in stepFunctionObjects"
          );
        }
        scheduleObjects.push({
          scheduleName,
          scheduleObject: buildPreflightSchedule(scope, stateMachine),
        });
        break;
      }
    }
  }

  return scheduleObjects;
}
