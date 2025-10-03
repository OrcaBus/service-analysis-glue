/* Event Bridge Rules */
import {
  BuildReadSetRuleProps,
  eventBridgeRuleNameList,
  EventBridgeRuleObject,
  EventBridgeRuleProps,
  EventBridgeRulesProps,
} from './interfaces';
import { EventPattern, Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  FASTQ_GLUE_EVENT_SOURCE,
  FASTQ_GLUE_READ_SETS_ADDED_EVENT_DETAIL_TYPE,
  STACK_PREFIX,
} from '../constants';

/*
https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html
*/

function buildReadSetsAddedEventPattern(): EventPattern {
  return {
    detailType: [FASTQ_GLUE_READ_SETS_ADDED_EVENT_DETAIL_TYPE],
    source: [FASTQ_GLUE_EVENT_SOURCE],
    detail: {
      instrumentRunId: [{ exists: true }],
    },
  };
}

function buildEventRule(scope: Construct, props: EventBridgeRuleProps): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}-${props.ruleName}`,
    eventPattern: props.eventPattern,
    eventBus: props.eventBus,
  });
}

function buildReadSetsAddedRule(scope: Construct, props: BuildReadSetRuleProps): Rule {
  return buildEventRule(scope, {
    ruleName: props.ruleName,
    eventPattern: buildReadSetsAddedEventPattern(),
    eventBus: props.eventBus,
  });
}

export function buildAllEventRules(
  scope: Construct,
  props: EventBridgeRulesProps
): EventBridgeRuleObject[] {
  const eventBridgeRuleObjects: EventBridgeRuleObject[] = [];

  // Iterate over the eventBridgeNameList and create the event rules
  for (const ruleName of eventBridgeRuleNameList) {
    switch (ruleName) {
      case 'fastqGlueFastqReadSetAdded': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildReadSetsAddedRule(scope, {
            ruleName: ruleName,
            eventBus: props.eventBus,
          }),
        });
        break;
      }
    }
  }

  // Return the event bridge rule objects
  return eventBridgeRuleObjects;
}
