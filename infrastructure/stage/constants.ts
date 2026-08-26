import {
  TestSamplePreDraftDataConfiguration,
  WorkflowPayloadVersionType,
  WorkflowsObjectType,
} from './interfaces';
import path from 'path';
import {
  ACCOUNT_ID_ALIAS,
  REGION,
  StageName,
} from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const LAYERS_DIR = path.join(APP_ROOT, 'layers');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-functions-templates');

/* Stack constants */
export const STACK_PREFIX = 'orca-analysis-glue';

/* Workflow constants */
export const CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME: Record<StageName, WorkflowsObjectType> = {
  BETA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: {
      name: 'bclconvert-interop-qc',
      version: '1.9.0--1.33',
      codeVersion: '56670e1',
      executionEngine: 'ICA',
      executionEnginePipelineId: '9bbd1a1d-1f7f-42dd-84c0-936ae17688b7',
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
      version: '2.6.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      name: 'dragen-wgts-dna',
      version: '4.4.6',
      codeVersion: 'ca414b8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '6e13f764-cc88-4214-8eeb-6d30374de354',
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
      version: '0.6.4',
      codeVersion: '4946aa8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '51f0d1dc-be92-4a5e-9a8a-ad8d44a6431c',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '1ec3da8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '1f15f496-9f76-4bc5-98f7-e1e00ce8a407',
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
      version: '1.9.0--1.33',
      codeVersion: '56670e1',
      executionEngine: 'ICA',
      executionEnginePipelineId: '9bbd1a1d-1f7f-42dd-84c0-936ae17688b7',
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
      version: '2.6.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      name: 'dragen-wgts-dna',
      version: '4.4.6',
      codeVersion: 'ca414b8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '6e13f764-cc88-4214-8eeb-6d30374de354',
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
      version: '0.6.4',
      codeVersion: '4946aa8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '51f0d1dc-be92-4a5e-9a8a-ad8d44a6431c',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '1ec3da8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '1f15f496-9f76-4bc5-98f7-e1e00ce8a407',
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
      version: '1.9.0--1.33',
      codeVersion: '56670e1',
      executionEngine: 'ICA',
      executionEnginePipelineId: '9bbd1a1d-1f7f-42dd-84c0-936ae17688b7',
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
      version: '2.6.0',
      executionEngine: 'Unknown',
      executionEnginePipelineId: 'Unknown',
    },
    // DNA
    dragenWgtsDna: {
      name: 'dragen-wgts-dna',
      version: '4.4.4',
      codeVersion: '724101a',
      executionEngine: 'ICA',
      executionEnginePipelineId: '812c4ee5-b0bd-4c55-b4c2-cafe70ecfc8e',
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
      version: '0.6.4',
      codeVersion: '4946aa8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '51f0d1dc-be92-4a5e-9a8a-ad8d44a6431c',
      validationState: 'VALIDATED',
    },
    // RNA
    dragenWgtsRna: {
      name: 'dragen-wgts-rna',
      version: '4.4.4',
      codeVersion: '1ec3da8',
      executionEngine: 'ICA',
      executionEnginePipelineId: '1f15f496-9f76-4bc5-98f7-e1e00ce8a407',
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
    // BCLConvert InterOp QC
    bclconvertInteropQc: '2026.04.01',
    // ctDNA
    dragenTso500Ctdna: '2025.07.29',
    pieriandxTso500Ctdna: '2025.09.25',
    // DNA
    dragenWgtsDna: '2025.06.04',
    oncoanalyserWgtsDna: '2026.04.16',
    sash: '2025.08.05',
    // RNA
    dragenWgtsRna: '2025.08.05',
    arribaWgtsRna: '2025.08.05',
    oncoanalyserWgtsRna: '2026.05.12',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2025.08.05',
    rnasum: '2025.09.30',
  },
  GAMMA: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: '2026.04.01',
    // ctDNA
    dragenTso500Ctdna: '2025.07.29',
    pieriandxTso500Ctdna: '2025.09.25',
    // DNA
    dragenWgtsDna: '2025.06.04',
    oncoanalyserWgtsDna: '2026.04.16',
    sash: '2025.08.05',
    // RNA
    dragenWgtsRna: '2025.08.05',
    arribaWgtsRna: '2025.08.05',
    oncoanalyserWgtsRna: '2026.05.12',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2025.08.05',
    rnasum: '2025.09.30',
  },
  PROD: {
    // BCLConvert InterOp QC
    bclconvertInteropQc: '2026.04.01',
    // ctDNA
    dragenTso500Ctdna: '2025.07.29',
    pieriandxTso500Ctdna: '2025.09.25',
    // DNA
    dragenWgtsDna: '2025.06.04',
    oncoanalyserWgtsDna: '2026.04.16',
    sash: '2025.08.05',
    // RNA
    dragenWgtsRna: '2025.08.05',
    arribaWgtsRna: '2025.08.05',
    oncoanalyserWgtsRna: '2026.05.12',
    // DNA / RNA
    oncoanalyserWgtsDnaRna: '2025.08.05',
    rnasum: '2025.09.30',
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

export const SRM_EVENT_SOURCE = 'orcabus.sequencerunmanager';
export const SRM_SAMPLE_SHEET_STATE_CHANGE_DETAIL_TYPE = 'SequenceRunSampleSheetChange';

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

/* Validation Stuff */
// S3 Paths
export const ANALYSIS_GLUE_ARTEFACTS_BUCKET_NAME: Record<Extract<StageName, 'PROD'>, string> = {
  PROD: `analysis-glue-artefacts-${ACCOUNT_ID_ALIAS.PROD}-${REGION}`,
};
export const DEPLOYMENT_SNAPSHOTS_S3_PREFIX = 'deployment-snapshots/';

// SSM PARAMATER PATHS FOR VALIDATION STUFF
export const SSM_PARAMETER_PATH_S3_DEPLOYMENT_SNAPSHOT_PREFIX = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'deployment-snapshot-s3-prefix'
);
export const SSM_PARAMETER_PATH_GIT_STACK_LIST = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'git-stacks-to-observe'
);
export const SSM_PARAMETER_PATH_CONFIGURATIONS_PREFIX = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'pre-flight-configurations'
);

// CLOUDFORMATION STACKS OF INTEREST
export const PROD_CLOUDFORMATION_STACKS_TO_MONITOR: string[] = [
  // Upstream services
  'OrcaBusProd-MetadataManagerStack',
  'OrcaBusProd-FileManagerStatefulStack',
  'OrcaBusProd-FileManagerStack',
  'OrcaBusProd-WorkflowManagerStack',
  'OrcaBusProd-OrcaBusStatefulIcav2DataCopyServiceStack',
  'OrcaBusProd-OrcaBusStatelessIcav2DataCopyServiceStack',
  'OrcaBusProd-StatefulFastqDecompressionStack',
  'OrcaBusProd-StatelessFastqDecompressionStack',
  'OrcaBusProd-StatefulFastqSyncManager',
  'OrcaBusProd-StatelessFastqSyncManager',
  'OrcaBusProd-StatefulFastqStack',
  'OrcaBusProd-StatelessFastqStack',
  // Pipeline generation
  // ctDNA pipeline
  'OrcaBusProd-StatefulDragenTso500Ctdna',
  'OrcaBusProd-StatelessDragenTso500Ctdna',
  // WGTS DNA Pipeline
  // Dragen WGTS DNA Stack
  'OrcaBusProd-StatefulDragenWgtsDnaPipeline',
  'OrcaBusProd-StatelessDragenWgtsDnaPipelineManager',
  // Oncoanalyser WGTS DNA Stack
  'OrcaBusProd-StatefulOncoanalyserWgtsDnaPipeline',
  'OrcaBusProd-StatelessOncoanalyserWgtsDnaPipelineManager',
  // Sash WGTS DNA Stack
  'OrcaBusProd-StatefulSashPipeline',
  'OrcaBusProd-StatelessSashPipelineManager',
  // Workflow Running
  'OrcaBusProd-Icav2WesManagerStatefulDeployStack',
  'OrcaBusProd-Icav2WesManagerStatelessDeployStack',
];

/**
 * Validation parameters
 */

// Engine Parameters
const HOFMANN_MAIN_PROJECT_ID = 'df67fe66-671a-4234-9024-764148fec155';
const HOFMANN_S3_PREFIX =
  's3://project-data-465105354675-ap-southeast-2/byob-icav2/project-hofmann-main/preflight-validation-analyses/';

// CTDNA
// WORKFLOW MIDFIX
const CTDNA_WORKFLOW_MIDFIX = 'dragen-tso500-ctdna';
// SAMPLES
const SERA_CTDNA_COMP_1PCT_LIBRARY_ID = 'L2500384';
export const PROD_CTDNA_TEST_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS: TestSamplePreDraftDataConfiguration[] =
  [
    {
      libraryIdList: [SERA_CTDNA_COMP_1PCT_LIBRARY_ID],
      payload: {
        version: PAYLOAD_VERSIONS_BY_NAME.PROD.dragenTso500Ctdna,
        data: {
          tags: {
            libraryId: SERA_CTDNA_COMP_1PCT_LIBRARY_ID,
          },
          engineParameters: {
            logsUriPrefix: `${HOFMANN_S3_PREFIX}/logs/${CTDNA_WORKFLOW_MIDFIX}`,
            cacheUriPrefix: `${HOFMANN_S3_PREFIX}/cache/${CTDNA_WORKFLOW_MIDFIX}`,
            outputUriPrefix: `${HOFMANN_S3_PREFIX}/output/${CTDNA_WORKFLOW_MIDFIX}`,
            projectId: HOFMANN_MAIN_PROJECT_ID,
          },
        },
      },
    },
  ];

// WGTS
// WORKFLOW MIDFIX
const DRAGEN_WGTS_DNA_WORKFLOW_MIDFIX = 'dragen-wgts-dna';
const ONCOANALYSER_WGTS_DNA_WORKFLOW_MIDFIX = 'oncoanalyser-wgts-dna';
const SASH_WORKFLOW_MIDFIX = 'sash';

// SAMPLES
const HCC1395_NORMAL_LIBRARY_ID = 'L2301217';
const HCC1395_TUMOR_LIBRARY_ID = 'L2301218';

export const PROD_DRAGEN_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS: TestSamplePreDraftDataConfiguration[] =
  [
    {
      libraryIdList: [HCC1395_NORMAL_LIBRARY_ID, HCC1395_TUMOR_LIBRARY_ID],
      payload: {
        version: PAYLOAD_VERSIONS_BY_NAME.PROD.dragenWgtsDna,
        data: {
          tags: {
            libraryId: HCC1395_NORMAL_LIBRARY_ID,
            tumorLibraryId: HCC1395_TUMOR_LIBRARY_ID,
          },
          engineParameters: {
            logsUriPrefix: `${HOFMANN_S3_PREFIX}/logs/${DRAGEN_WGTS_DNA_WORKFLOW_MIDFIX}`,
            cacheUriPrefix: `${HOFMANN_S3_PREFIX}/cache/${DRAGEN_WGTS_DNA_WORKFLOW_MIDFIX}`,
            outputUriPrefix: `${HOFMANN_S3_PREFIX}/output/${DRAGEN_WGTS_DNA_WORKFLOW_MIDFIX}`,
            projectId: HOFMANN_MAIN_PROJECT_ID,
          },
        },
      },
    },
  ];

export const PROD_ONCOANALYSER_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS: TestSamplePreDraftDataConfiguration[] =
  [
    {
      libraryIdList: [HCC1395_NORMAL_LIBRARY_ID, HCC1395_TUMOR_LIBRARY_ID],
      payload: {
        version: PAYLOAD_VERSIONS_BY_NAME.PROD.oncoanalyserWgtsDna,
        data: {
          tags: {
            normalLibraryId: HCC1395_NORMAL_LIBRARY_ID,
            tumorLibraryId: HCC1395_TUMOR_LIBRARY_ID,
          },
          engineParameters: {
            logsUriPrefix: `${HOFMANN_S3_PREFIX}/logs/${ONCOANALYSER_WGTS_DNA_WORKFLOW_MIDFIX}`,
            cacheUriPrefix: `${HOFMANN_S3_PREFIX}/cache/${ONCOANALYSER_WGTS_DNA_WORKFLOW_MIDFIX}`,
            outputUriPrefix: `${HOFMANN_S3_PREFIX}/output/${ONCOANALYSER_WGTS_DNA_WORKFLOW_MIDFIX}`,
            projectId: HOFMANN_MAIN_PROJECT_ID,
          },
        },
      },
    },
  ];

export const PROD_SASH_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS: TestSamplePreDraftDataConfiguration[] =
  [
    {
      libraryIdList: [HCC1395_NORMAL_LIBRARY_ID, HCC1395_TUMOR_LIBRARY_ID],
      payload: {
        version: PAYLOAD_VERSIONS_BY_NAME.PROD.sash,
        data: {
          tags: {
            libraryId: HCC1395_NORMAL_LIBRARY_ID,
            tumorLibraryId: HCC1395_TUMOR_LIBRARY_ID,
          },
          engineParameters: {
            logsUriPrefix: `${HOFMANN_S3_PREFIX}/logs/${SASH_WORKFLOW_MIDFIX}`,
            cacheUriPrefix: `${HOFMANN_S3_PREFIX}/cache/${SASH_WORKFLOW_MIDFIX}`,
            outputUriPrefix: `${HOFMANN_S3_PREFIX}/output/${SASH_WORKFLOW_MIDFIX}`,
            projectId: HOFMANN_MAIN_PROJECT_ID,
          },
        },
      },
    },
  ];
