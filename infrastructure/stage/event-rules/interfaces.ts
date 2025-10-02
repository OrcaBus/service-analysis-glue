import { EventPattern, IEventBus, Rule } from 'aws-cdk-lib/aws-events';

/**
 * EventBridge Rules Interfaces
 */
export type EventBridgeRuleName =
  // Post-fastq read sets added
  'fastqGlueFastqReadSetAdded';

export const eventBridgeRuleNameList: EventBridgeRuleName[] = [
  // Post-fastq read sets added
  'fastqGlueFastqReadSetAdded',
];

export interface EventBridgeRuleProps {
  ruleName: EventBridgeRuleName;
  eventBus: IEventBus;
  eventPattern: EventPattern;
}

export interface EventBridgeRulesProps {
  eventBus: IEventBus;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeRuleName;
  ruleObject: Rule;
}

export type BuildReadSetRuleProps = Omit<EventBridgeRuleProps, 'eventPattern'>;
