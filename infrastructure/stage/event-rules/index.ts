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
  FASTQ_GLUE_FASTQ_SET_CREATED_EVENT_DETAIL_TYPE,
  STACK_PREFIX,
} from '../constants';

/*
https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html
*/

function buildFastqSetCreatedEventPattern(): EventPattern {
  return {
    detailType: [FASTQ_GLUE_FASTQ_SET_CREATED_EVENT_DETAIL_TYPE],
    source: [FASTQ_GLUE_EVENT_SOURCE],
    detail: {
      instrumentRunId: [{ exists: true }],
    },
  };
}

function buildEventRule(scope: Construct, props: EventBridgeRuleProps): Rule {
  // EventBridge rule names must be <= 64 characters. The logical ruleName is used
  // internally as the construct id / lookup key, but the physical rule name drops
  // the redundant `fastqSetCreatedTo` prefix (the event pattern already scopes it)
  // to keep the STACK_PREFIX-prefixed physical name within the 64 character limit.
  const physicalRuleName = props.ruleName.replace(/^fastqSetCreatedTo/, '');
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}-${physicalRuleName}`,
    eventPattern: props.eventPattern,
    eventBus: props.eventBus,
  });
}

function buildFastqSetsCreatedRule(scope: Construct, props: BuildReadSetRuleProps): Rule {
  return buildEventRule(scope, {
    ruleName: props.ruleName,
    eventPattern: buildFastqSetCreatedEventPattern(),
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
      case 'fastqSetCreatedToWgtsAnalysisBuilder':
      case 'fastqSetCreatedToCttsoAnalysisBuilder':
      case 'fastqSetCreatedToBclconvertInteropQcAnalysisBuilder': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildFastqSetsCreatedRule(scope, {
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
