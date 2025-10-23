/**
 * Stateful application stack interface.
 */
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';

export interface StatefulApplicationStackConfig {
  // Values
  // Detail
  ssmParameterValues: SsmParameterValues;

  // Keys
  ssmParameterPaths: SsmParameterPaths;
}

/**
 * Stateless application stack interface.
 */
export interface StatelessApplicationStackConfig {
  // SSM Parameter Keys
  ssmParameterPaths: SsmParameterPaths;

  // Event Stuff
  eventBusName: string;

  // Workflow manager stuff
  isNewWorkflowManagerDeployed: boolean;
}

export type SampleType = 'ctDNA' | 'DNA' | 'RNA';

export type MetadataSampleType = 'ctDNA' | 'WGS' | 'WTS';

export const MetadataSampleTypeBySampleType: Record<SampleType, MetadataSampleType> = {
  ctDNA: 'ctDNA',
  DNA: 'WGS',
  RNA: 'WTS',
};

export type WorkflowNameType =
  // ctDNA
  | 'dragenTso500Ctdna'
  | 'pieriandxTso500Ctdna'
  // DNA
  | 'dragenWgtsDna'
  | 'oncoanalyserWgtsDna'
  | 'sash'
  // RNA
  | 'dragenWgtsRna'
  | 'arribaWgtsRna'
  | 'oncoanalyserWgtsRna'
  // DNA / RNA
  | 'oncoanalyserWgtsDnaRna'
  | 'rnasum';

export const WORKFLOW_NAMES_LIST: WorkflowNameType[] = [
  // ctDNA
  'dragenTso500Ctdna',
  'pieriandxTso500Ctdna',
  // DNA
  'dragenWgtsDna',
  'oncoanalyserWgtsDna',
  'sash',
  // RNA
  'dragenWgtsRna',
  'arribaWgtsRna',
  'oncoanalyserWgtsRna',
  // DNA / RNA
  'oncoanalyserWgtsDnaRna',
  'rnasum',
];

// FIXME - Coming soon, once we move to new workflow manager
// We will also hard-code the execution engines and pipeline ids here too
export interface Workflow {
  name: WorkflowNameType;
  version: string;
  codeVersion?: string;
  executionEngine?: string;
  executionEnginePipelineId?: string;
}

/**
 * BCLConvert InterOp QC Workflow Versions
 */
export type BclconvertInteropQcWorkflowVersionType = '1.5.0--1.31';
export type BclconvertInteropQcPayloadVersionType = '2025.05.29';

/**
 * CTDNA Workflow Versions
 */
export type DragenTso500CtdnaWorkflowVersionType =
  // FIXME - add in links to reference versions we support
  '2.6.0' | '2.6.1';

export type PierianDxTso500CtdnaWorkflowVersionType = '2.1';
// '2.6' Coming Soon

/**
 * DNA Workflow Versions
 */
export type DragenWgtsDnaWorkflowVersionType = '4.4.4';

export type OncoanalyserWgtsDnaWorkflowVersionType = '2.0.0' | '2.1.0' | '2.2.0';

export type SashWorkflowVersionType = '0.6.1' | '0.6.2';

/**
 * RNA Workflow Versions
 */
export type DragenWgtsRnaWorkflowVersionType = '4.4.4';

export type ArribaWorkflowVersionType = '2.5.0';

export type OncoanalyserWgtsRnaWorkflowVersionType = '2.0.0' | '2.1.0' | '2.2.0';

/**
 * DNA/RNA Workflow Versions
 */
export type OncoanalyserWgtsDnaRnaWorkflowVersionType = '2.0.0' | '2.1.0' | '2.2.0';

export type RnasumWorkflowVersionType = '2.0.0';

export type WorkflowVersionObjectType =
  // BCLConvert InterOp QC
  | Record<'bclconvertInteropQc', BclconvertInteropQcWorkflowVersionType>
  // ctDNA
  | Record<'dragenTso500Ctdna', DragenTso500CtdnaWorkflowVersionType>
  | Record<'pieriandxTso500Ctdna', PierianDxTso500CtdnaWorkflowVersionType>
  // DNA
  | Record<'dragenWgtsDna', DragenWgtsDnaWorkflowVersionType>
  | Record<'oncoanalyserWgtsDna', OncoanalyserWgtsDnaWorkflowVersionType>
  | Record<'sash', SashWorkflowVersionType>
  // RNA
  | Record<'dragenWgtsRna', DragenWgtsRnaWorkflowVersionType>
  | Record<'arribaWgtsRna', ArribaWorkflowVersionType>
  | Record<'oncoanalyserWgtsRna', OncoanalyserWgtsRnaWorkflowVersionType>
  // DNA / RNA
  | Record<'oncoanalyserWgtsDnaRna', OncoanalyserWgtsDnaRnaWorkflowVersionType>
  | Record<'rnasum', RnasumWorkflowVersionType>;

export type WorkflowPayloadVersionType =
  // Payload Version Type
  Record<'bclconvertInteropQc', BclconvertInteropQcPayloadVersionType>;
