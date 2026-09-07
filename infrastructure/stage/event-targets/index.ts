import {
  AddSfnAsEventBridgeTargetProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
} from './interfaces';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as events from 'aws-cdk-lib/aws-events';

function ruleToSfnTarget(props: AddSfnAsEventBridgeTargetProps) {
  // We take in the event detail from the dragen wgts dna ready event
  // And return the entire detail to the state machine
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: events.RuleTargetInput.fromEventPath('$.detail'),
    })
  );
}

export function buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
  for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
    switch (eventBridgeTargetsName) {
      case 'fastqSetCreatedToWgtsAnalysisBuilderSfnTarget': {
        ruleToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'fastqSetCreatedToWgtsAnalysisBuilder'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'wgtsAnalysisBuilder'
          )?.sfnObject,
        });
        break;
      }
      case 'fastqSetCreatedToCttsoAnalysisBuilderSfnTarget': {
        ruleToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'fastqSetCreatedToCttsoAnalysisBuilder'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'cttsoAnalysisBuilder'
          )?.sfnObject,
        });
        break;
      }
      case 'fastqSetCreatedToBclconvertInteropQcAnalysisBuilderSfnTarget': {
        ruleToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'fastqSetCreatedToBclconvertInteropQcAnalysisBuilder'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'bclconvertInteropQcAnalysisBuilder'
          )?.sfnObject,
        });
        break;
      }
      case 'srmSampleSheetChangeToPreFlightValidationSfnTarget': {
        if (props.prodOnly) {
          ruleToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
            eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
              (eventBridgeObject) => eventBridgeObject.ruleName === 'SrmSampleSheetStateChange'
            )?.ruleObject,
            stateMachineObj: props.stepFunctionObjects.find(
              (sfnObject) => sfnObject.stateMachineName === 'runPreflightChecks'
            )?.sfnObject,
          });
        }
        break;
      }
    }
  }
}
