import { EventPattern, IEventBus, Rule } from 'aws-cdk-lib/aws-events';

/**
 * EventBridge Rules Interfaces
 */
export type EventBridgeRuleName =
  // SRM SampleSheet Change
  | 'SrmSampleSheetStateChange'
  // Post-fastq sets created
  | 'fastqGlueFastqSetCreated';

export const eventBridgeRuleNameList: EventBridgeRuleName[] = [
  // SRM updated, run validations
  'SrmSampleSheetStateChange',
  // Post-fastq sets created
  'fastqGlueFastqSetCreated',
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
