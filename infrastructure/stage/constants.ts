import { WorkflowPayloadVersionType, WorkflowVersionObjectType } from './interfaces';
import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-functions-templates');

/* Stack constants */
export const STACK_PREFIX = 'orca-analysis-glue';

/* Workflow constants */
export const WORKFLOW_VERSIONS_BY_NAME: Record<StageName, WorkflowVersionObjectType> = {
  BETA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: '1.5.0--1.31',
    // ctDNA
    dragenTso500Ctdna: '2.6.1',
    pieriandxTso500Ctdna: '2.1',
    // DNA
    dragenWgtsDna: '4.4.4',
    arribaWgtsRna: '2.5.0',
    oncoanalyserWgtsDna: '2.2.0',
    sash: '0.6.3',
    // RNA
    dragenWgtsRna: '4.4.4',
    oncoanalyserWgtsRna: '2.2.0',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2.2.0',
    rnasum: '2.0.0',
  },
  GAMMA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: '1.5.0--1.31',
    // ctDNA
    dragenTso500Ctdna: '2.6.0',
    pieriandxTso500Ctdna: '2.1',
    // DNA
    dragenWgtsDna: '4.4.4',
    arribaWgtsRna: '2.5.0',
    oncoanalyserWgtsDna: '2.2.0',
    sash: '0.6.3',
    // RNA
    dragenWgtsRna: '4.4.4',
    oncoanalyserWgtsRna: '2.2.0',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2.2.0',
    rnasum: '2.0.0',
  },
  PROD: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: '1.5.0--1.31',
    // ctDNA
    dragenTso500Ctdna: '2.6.0',
    pieriandxTso500Ctdna: '2.1',
    // DNA
    dragenWgtsDna: '4.4.4',
    arribaWgtsRna: '2.5.0',
    oncoanalyserWgtsDna: '2.2.0',
    sash: '0.6.3',
    // RNA
    dragenWgtsRna: '4.4.4',
    oncoanalyserWgtsRna: '2.2.0',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2.2.0',
    rnasum: '2.0.0',
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
export const FASTQ_GLUE_READ_SETS_ADDED_EVENT_DETAIL_TYPE = 'ReadSetsAdded';

/* Future proofing */
export const NEW_WORKFLOW_MANAGER_IS_DEPLOYED: Record<StageName, boolean> = {
  BETA: true,
  GAMMA: true,
  PROD: true,
};

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
