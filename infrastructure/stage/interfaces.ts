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
}

export type SampleType = 'ctDNA' | 'DNA' | 'RNA';

export type MetadataSampleType = 'ctDNA' | 'WGS' | 'WTS';

export const MetadataSampleTypeBySampleType: Record<SampleType, MetadataSampleType> = {
  ctDNA: 'ctDNA',
  DNA: 'WGS',
  RNA: 'WTS',
};

export type WorkflowNameType =
  // BCLConvert InterOp QC
  | 'bclconvertInteropQc'
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

// We will also hard-code the execution engines and pipeline ids here too
type ExecutionEngineName = 'Unknown' | 'ICA' | 'SEQERA' | 'AWS_BATCH' | 'AWS_ECS' | 'AWS_EKS';

type ValidationState = 'UNVALIDATED' | 'VALIDATED' | 'DEPRECATED' | 'FAILED';

export interface Workflow {
  name: string;
  version: string;
  codeVersion?: string;
  executionEngine?: ExecutionEngineName;
  executionEnginePipelineId?: string;
  validationState?: ValidationState;
}

/**
 * BCLConvert InterOp QC Workflow Versions
 */
export type BclconvertInteropQcWorkflowObjectType = Workflow & {
  // https://github.com/umccr/cwl-ica/releases/tag/bclconvert-interop-qc%2F1.5.0--1.31__20251015013928
  name: 'bclconvert-interop-qc';
  version: '1.5.0--1.31';
  codeVersion: 'ea35fcd';
  executionEngine: 'ICA';
  executionEnginePipelineId: 'ebbcd07d-a030-4841-b2ad-ac985c776f36';
  validationState: 'VALIDATED';
};

export type BclconvertInteropQcPayloadVersionType = '2025.05.29';

/**
 * CTDNA Workflow Versions
 */
export type DragenTso500CtdnaWorkflowObjectType = Workflow &
  (
    | {
        // Bundle Link: https://ica.illumina.com/ica/bundles/b753fbd9-453b-428d-89bd-8596de7337de/details
        // Pipeline Link: https://ica.illumina.com/ica/bundles/b753fbd9-453b-428d-89bd-8596de7337de/pipelines/63dc920c-adde-4891-8aae-84a6b9569f37
        name: 'dragen-tso500-ctdna';
        version: '2.6.0';
        codeVersion: '2_6_0_25';
        executionEngine: 'ICA';
        executionEnginePipelineId: '63dc920c-adde-4891-8aae-84a6b9569f37';
        validationState: 'VALIDATED';
      }
    | {
        // Bundle Link: https://ica.illumina.com/ica/bundles/fbdb909d-321b-4a0f-8e4e-8e5b0884dac4/details
        // Pipeline Link: https://ica.illumina.com/ica/bundles/fbdb909d-321b-4a0f-8e4e-8e5b0884dac4/pipelines/67675369-6129-4b21-918c-eceb3dced88d
        name: 'dragen-tso500-ctdna';
        version: '2.6.1';
        codeVersion: '2_6_1_8';
        executionEngine: 'ICA';
        executionEnginePipelineId: '67675369-6129-4b21-918c-eceb3dced88d';
        validationState: 'VALIDATED';
      }
  );

export type PierianDxTso500CtdnaWorkflowObjectType = Workflow & // 2.1.0 -- DEPRECATED
  (
    | {
        name: 'pieriandx-tso500-ctdna';
        version: '2.1.0';
        executionEngine: 'Unknown';
        executionEnginePipelineId: 'Unknown';
      }
    // 2.6.0 -- CURRENT
    | {
        name: 'pieriandx-tso500-ctdna';
        version: '2.6.0';
        executionEngine: 'Unknown';
        executionEnginePipelineId: 'Unknown';
      }
  );

/**
 * DNA Workflow Versions
 */
export type DragenWgtsDnaWorkflowObjectType = Workflow &
  (
    | {
        // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-dna-pipeline%2F4.4.4__20260104232900
        name: 'dragen-wgts-dna';
        version: '4.4.4';
        codeVersion: '724101a';
        executionEngine: 'ICA';
        executionEnginePipelineId: '812c4ee5-b0bd-4c55-b4c2-cafe70ecfc8e';
        validationState: 'VALIDATED';
      }
    | {
        // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-dna-pipeline%2F4.4.6__20260104232925
        name: 'dragen-wgts-dna';
        version: '4.4.6';
        codeVersion: '5ca7ec6';
        executionEngine: 'ICA';
        executionEnginePipelineId: '054ed1cc-4e29-46c0-afa0-8d2cf637a043';
        validationState: 'VALIDATED';
      }
  );

export type OncoanalyserWgtsDnaWorkflowObjectType = Workflow & {
  name: 'oncoanalyser-wgts-dna';
  version: '2.2.0';
  codeVersion: 'b94cbc7';
  executionEngine: 'ICA';
  executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0';
  validationState: 'VALIDATED';
};

export type SashWorkflowObjectType = Workflow & {
  name: 'sash';
  version: '0.6.3';
  codeVersion: '89a7a21';
  executionEngine: 'ICA';
  executionEnginePipelineId: '5b4060de-5e43-4aa6-b408-f51537d43c65';
  validationState: 'VALIDATED';
};

/**
 * RNA Workflow Versions
 */
export type DragenWgtsRnaWorkflowObjectType = Workflow & {
  // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-rna-pipeline%2F4.4.4__20260104233012
  name: 'dragen-wgts-rna';
  version: '4.4.4';
  codeVersion: '1ec3da8';
  executionEngine: 'ICA';
  executionEnginePipelineId: '1f15f496-9f76-4bc5-98f7-e1e00ce8a407';
  validationState: 'VALIDATED';
};

export type ArribaWorkflowObjectType = Workflow & {
  name: 'arriba-wgts-rna';
  version: '2.5.0';
  codeVersion: '9938ff8';
  executionEngine: 'ICA';
  executionEnginePipelineId: '372b7fbd-d4f5-4ed4-8e75-d773971ed25f';
  validationState: 'VALIDATED';
};

export type OncoanalyserWgtsRnaWorkflowObjectType = Workflow & {
  name: 'oncoanalyser-wgts-rna';
  version: '2.2.0';
  codeVersion: 'b94cbc7';
  executionEngine: 'ICA';
  executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0';
  validationState: 'VALIDATED';
};

/**
 * DNA/RNA Workflow Versions
 */
export type OncoanalyserWgtsDnaRnaWorkflowObjectType = Workflow & {
  name: 'oncoanalyser-wgts-dna-rna';
  version: '2.2.0';
  codeVersion: 'b94cbc7';
  executionEngine: 'ICA';
  executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0';
  validationState: 'VALIDATED';
};

export type RnasumWorkflowObjectType = Workflow & {
  name: 'rnasum';
  version: '2.0.0';
  codeVersion: '35c78cd';
  executionEngine: 'ICA';
  executionEnginePipelineId: 'e999af04-268e-4307-a037-2855ea5aa073';
  validationState: 'VALIDATED';
};

export type WorkflowsObjectType =
  // BCLConvert InterOp QC
  | Record<'bclconvertInteropQc', BclconvertInteropQcWorkflowObjectType>
  // ctDNA
  | Record<'dragenTso500Ctdna', DragenTso500CtdnaWorkflowObjectType>
  | Record<'pieriandxTso500Ctdna', PierianDxTso500CtdnaWorkflowObjectType>
  // DNA
  | Record<'dragenWgtsDna', DragenWgtsDnaWorkflowObjectType>
  | Record<'oncoanalyserWgtsDna', OncoanalyserWgtsDnaWorkflowObjectType>
  | Record<'sash', SashWorkflowObjectType>
  // RNA
  | Record<'dragenWgtsRna', DragenWgtsRnaWorkflowObjectType>
  | Record<'arribaWgtsRna', ArribaWorkflowObjectType>
  | Record<'oncoanalyserWgtsRna', OncoanalyserWgtsRnaWorkflowObjectType>
  // DNA / RNA
  | Record<'oncoanalyserWgtsDnaRna', OncoanalyserWgtsDnaRnaWorkflowObjectType>
  | Record<'rnasum', RnasumWorkflowObjectType>;

export type WorkflowPayloadVersionType =
  // Payload Version Type
  Record<'bclconvertInteropQc', BclconvertInteropQcPayloadVersionType>;
