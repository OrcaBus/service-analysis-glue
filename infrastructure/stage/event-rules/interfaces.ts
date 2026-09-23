import { EventPattern, IEventBus, Rule } from 'aws-cdk-lib/aws-events';

/**
 * EventBridge Rules Interfaces
 */
export type EventBridgeRuleName =
  // Post-fastq sets created
  | 'fastqSetCreatedToWgtsAnalysisBuilder'
  | 'fastqSetCreatedToCttsoAnalysisBuilder'
  | 'fastqSetCreatedToBclconvertInteropQcAnalysisBuilder';

export const eventBridgeRuleNameList: EventBridgeRuleName[] = [
  // Post-fastq sets created
  'fastqSetCreatedToWgtsAnalysisBuilder',
  'fastqSetCreatedToCttsoAnalysisBuilder',
  'fastqSetCreatedToBclconvertInteropQcAnalysisBuilder',
];

export interface EventBridgeRuleProps {
  ruleName: EventBridgeRuleName;
  eventBus: IEventBus;
  eventPattern: EventPattern;
}

export interface EventBridgeRulesProps {
  eventBus: IEventBus;
  prodOnly: boolean;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeRuleName;
  ruleObject: Rule;
}

export type BuildReadSetRuleProps = Omit<EventBridgeRuleProps, 'eventPattern'>;
