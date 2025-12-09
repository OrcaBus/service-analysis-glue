import { WorkflowPayloadVersionType, WorkflowsObjectType } from './interfaces';
import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-functions-templates');

/* Stack constants */
export const STACK_PREFIX = 'orca-analysis-glue';

/* Workflow constants */
export const CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME: Record<StageName, WorkflowsObjectType> = {
  BETA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: {
      name: 'bclconvert-interop-qc',
      version: '1.5.0--1.31',
      codeVersion: 'ea35fcd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'ebbcd07d-a030-4841-b2ad-ac985c776f36',
      validationState: 'VALIDATED',
    },
    // ctDNA
    dragenTso500Ctdna: {
      name: 'dragen-tso500-ctdna',
      version: '2.6.0',
      codeVersion: '2_6_0_25',
      executionEngine: 'ICA',
      executionEnginePipelineId: '63dc920c-adde-4891-8aae-84a6b9569f37',
      validationState: 'VALIDATED',
    },
    pieriandxTso500Ctdna: {
      name: 'pieriandx-tso500-ctdna',
      version: '2.1.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-dna-pipeline%2F4.4.4__20251102002321
      name: 'dragen-wgts-dna',
      version: '4.4.4',
      codeVersion: '677f34a',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'd43ef483-fdef-4dc3-8dac-85165c7f4d2e',
      validationState: 'VALIDATED',
    },
    arribaWgtsRna: {
      name: 'arriba-wgts-rna',
      version: '2.5.0',
      codeVersion: '9938ff8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '372b7fbd-d4f5-4ed4-8e75-d773971ed25f',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsDna: {
      name: 'oncoanalyser-wgts-dna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    sash: {
      name: 'sash',
      version: '0.6.3',
      codeVersion: '89a7a21',
      executionEngine: 'ICA',
      executionEnginePipelineId: '5b4060de-5e43-4aa6-b408-f51537d43c65',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '09d012e',
      executionEngine: 'ICA',
      executionEnginePipelineId: '079d5aa9-664c-472d-9baf-1e6a6c542401',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsRna: {
      name: 'oncoanalyser-wgts-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    // DNA / RNA
    oncoanalyserWgtsDnaRna: {
      name: 'oncoanalyser-wgts-dna-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    rnasum: {
      name: 'rnasum',
      version: '2.0.0',
      codeVersion: '35c78cd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'e999af04-268e-4307-a037-2855ea5aa073',
      validationState: 'VALIDATED',
    },
  },
  GAMMA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: {
      name: 'bclconvert-interop-qc',
      version: '1.5.0--1.31',
      codeVersion: 'ea35fcd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'ebbcd07d-a030-4841-b2ad-ac985c776f36',
      validationState: 'VALIDATED',
    },
    // ctDNA
    dragenTso500Ctdna: {
      name: 'dragen-tso500-ctdna',
      version: '2.6.0',
      codeVersion: '2_6_0_25',
      executionEngine: 'ICA',
      executionEnginePipelineId: '63dc920c-adde-4891-8aae-84a6b9569f37',
      validationState: 'VALIDATED',
    },
    pieriandxTso500Ctdna: {
      name: 'pieriandx-tso500-ctdna',
      version: '2.1.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-dna-pipeline%2F4.4.4__20251102002321
      name: 'dragen-wgts-dna',
      version: '4.4.4',
      codeVersion: '677f34a',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'd43ef483-fdef-4dc3-8dac-85165c7f4d2e',
      validationState: 'VALIDATED',
    },
    arribaWgtsRna: {
      name: 'arriba-wgts-rna',
      version: '2.5.0',
      codeVersion: '9938ff8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '372b7fbd-d4f5-4ed4-8e75-d773971ed25f',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsDna: {
      name: 'oncoanalyser-wgts-dna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    sash: {
      name: 'sash',
      version: '0.6.3',
      codeVersion: '89a7a21',
      executionEngine: 'ICA',
      executionEnginePipelineId: '5b4060de-5e43-4aa6-b408-f51537d43c65',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '09d012e',
      executionEngine: 'ICA',
      executionEnginePipelineId: '079d5aa9-664c-472d-9baf-1e6a6c542401',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsRna: {
      name: 'oncoanalyser-wgts-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    // DNA / RNA
    oncoanalyserWgtsDnaRna: {
      name: 'oncoanalyser-wgts-dna-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    rnasum: {
      name: 'rnasum',
      version: '2.0.0',
      codeVersion: '35c78cd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'e999af04-268e-4307-a037-2855ea5aa073',
      validationState: 'VALIDATED',
    },
  },
  PROD: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: {
      name: 'bclconvert-interop-qc',
      version: '1.5.0--1.31',
      codeVersion: 'ea35fcd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'ebbcd07d-a030-4841-b2ad-ac985c776f36',
      validationState: 'VALIDATED',
    },
    // ctDNA
    dragenTso500Ctdna: {
      name: 'dragen-tso500-ctdna',
      version: '2.6.0',
      codeVersion: '2_6_0_25',
      executionEngine: 'ICA',
      executionEnginePipelineId: '63dc920c-adde-4891-8aae-84a6b9569f37',
      validationState: 'VALIDATED',
    },
    pieriandxTso500Ctdna: {
      name: 'pieriandx-tso500-ctdna',
      version: '2.1.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      // https://github.com/umccr/cwl-ica/releases/tag/dragen-wgts-dna-pipeline%2F4.4.4__20251102002321
      name: 'dragen-wgts-dna',
      version: '4.4.4',
      codeVersion: '677f34a',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'd43ef483-fdef-4dc3-8dac-85165c7f4d2e',
      validationState: 'VALIDATED',
    },
    arribaWgtsRna: {
      name: 'arriba-wgts-rna',
      version: '2.5.0',
      codeVersion: '9938ff8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '372b7fbd-d4f5-4ed4-8e75-d773971ed25f',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsDna: {
      name: 'oncoanalyser-wgts-dna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    sash: {
      name: 'sash',
      version: '0.6.3',
      codeVersion: '89a7a21',
      executionEngine: 'ICA',
      executionEnginePipelineId: '5b4060de-5e43-4aa6-b408-f51537d43c65',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '09d012e',
      executionEngine: 'ICA',
      executionEnginePipelineId: '079d5aa9-664c-472d-9baf-1e6a6c542401',
      validationState: 'VALIDATED',
    },
    oncoanalyserWgtsRna: {
      name: 'oncoanalyser-wgts-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    // DNA / RNA
    oncoanalyserWgtsDnaRna: {
      name: 'oncoanalyser-wgts-dna-rna',
      version: '2.2.0',
      codeVersion: 'b94cbc7',
      executionEngine: 'ICA',
      executionEnginePipelineId: '40b8005e-1473-4257-9949-cc8b42750cf0',
      validationState: 'VALIDATED',
    },
    rnasum: {
      name: 'rnasum',
      version: '2.0.0',
      codeVersion: '35c78cd',
      executionEngine: 'ICA',
      executionEnginePipelineId: 'e999af04-268e-4307-a037-2855ea5aa073',
      validationState: 'VALIDATED',
    },
  },
};

export const PAYLOAD_VERSIONS_BY_NAME: Record<StageName, WorkflowPayloadVersionType> = {
  BETA: {
    bclconvertInteropQc: '2025.05.29',
  },
  GAMMA: {
    bclconvertInteropQc: '2025.05.29',
  },
  PROD: {
    bclconvertInteropQc: '2025.05.29',
  },
};

/* Event Constants */
export const EVENT_BUS_NAME = 'OrcaBusMain';
export const EVENT_SOURCE = 'orcabus.analysisglue';
export const WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_RUN_UPDATE_DETAIL_TYPE = 'WorkflowRunUpdate';

/* Event rule constants */
export const FASTQ_GLUE_EVENT_SOURCE = 'orcabus.fastqglue';
export const FASTQ_GLUE_FASTQ_SET_CREATED_EVENT_DETAIL_TYPE = 'FastqListRowsAdded';

/* SSM Parameter Paths */
export const SSM_PARAMETER_PATH_PREFIX = path.join('/orcabus/analysis-glue/');
// Workflow Parameters
export const SSM_PARAMETER_PATH_WORKFLOW_VERSION_PREFIX = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'workflow-versions'
);
export const SSM_PARAMETER_PATH_PAYLOAD_VERSION_PREFIX = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'payload-versions'
);
