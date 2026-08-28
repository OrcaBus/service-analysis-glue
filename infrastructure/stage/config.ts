import {
  EVENT_BUS_NAME,
  SSM_PARAMETER_PATH_PREFIX,
  CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME,
  SSM_PARAMETER_PATH_WORKFLOW_VERSION_PREFIX,
  SSM_PARAMETER_PATH_PAYLOAD_VERSION_PREFIX,
  PAYLOAD_VERSIONS_BY_NAME,
  PROD_DRAGEN_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
  PROD_CTDNA_TEST_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
  PROD_ONCOANALYSER_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
  PROD_SASH_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
  ANALYSIS_GLUE_ARTEFACTS_BUCKET_NAME,
  DEPLOYMENT_SNAPSHOTS_S3_PREFIX,
  SSM_PARAMETER_PATH_CONFIGURATIONS_PREFIX,
  SSM_PARAMETER_PATH_S3_DEPLOYMENT_SNAPSHOT_PREFIX,
  PROD_CLOUDFORMATION_STACKS_TO_MONITOR,
  SSM_PARAMETER_PATH_GIT_STACK_LIST,
} from './constants';
import { StatefulApplicationStackConfig, StatelessApplicationStackConfig } from './interfaces';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';

/**
 * Stateful stack properties for the workflow.
 * Mainly just linking values from SSM parameters
 * @param stage
 */

export function getSsmParameterValues(stage: StageName): SsmParameterValues {
  const ssmParametersBase = {
    workflowVersionsByWorkflowName: CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME[stage],
    payloadVersionsByWorkflowName: PAYLOAD_VERSIONS_BY_NAME[stage],
  };

  if (stage === 'PROD') {
    return {
      ...ssmParametersBase,
      preDraftDataConfigurations: {
        dragenTso500Ctdna: PROD_CTDNA_TEST_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
        dragenWgtsDna: PROD_DRAGEN_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
        oncoanalyserWgtsDna: PROD_ONCOANALYSER_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
        sash: PROD_SASH_WGTS_DNA_SAMPLES_PRE_DRAFT_DATA_CONFIGURATIONS,
      },
      s3DeploymentSnapshotPrefix: `s3://${ANALYSIS_GLUE_ARTEFACTS_BUCKET_NAME[stage]}/${DEPLOYMENT_SNAPSHOTS_S3_PREFIX}`,
      gitStacksToObserveList: PROD_CLOUDFORMATION_STACKS_TO_MONITOR,
    };
  }
  return ssmParametersBase;
}

export const getSsmParameterPaths = (stage: StageName): SsmParameterPaths => {
  const ssmParametersBase = {
    rootPrefix: SSM_PARAMETER_PATH_PREFIX,
    workflowVersionsPrefix: SSM_PARAMETER_PATH_WORKFLOW_VERSION_PREFIX,
    payloadVersionsPrefix: SSM_PARAMETER_PATH_PAYLOAD_VERSION_PREFIX,
  };

  if (stage === 'PROD') {
    return {
      ...ssmParametersBase,
      preDraftDataConfigurationsPrefix: SSM_PARAMETER_PATH_CONFIGURATIONS_PREFIX,
      s3DeploymentSnapshot: SSM_PARAMETER_PATH_S3_DEPLOYMENT_SNAPSHOT_PREFIX,
      gitStacksToObserveList: SSM_PARAMETER_PATH_GIT_STACK_LIST,
    };
  }
  return ssmParametersBase;
};

export const getStatefulStackProps = (stage: StageName): StatefulApplicationStackConfig => {
  const baseParams = {
    // SSM Parameter Paths
    ssmParameterPaths: getSsmParameterPaths(stage),

    // SSM Parameter Values
    ssmParameterValues: getSsmParameterValues(stage),

    // StageName
    stageName: stage,
  };

  // S3 Artefacts Name
  if (stage === 'PROD') {
    return {
      ...baseParams,
      analysisGlueArtefactsBucketName: ANALYSIS_GLUE_ARTEFACTS_BUCKET_NAME[stage],
    };
  }
  return baseParams;
};

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  const baseParams = {
    // SSM Parameter Paths
    ssmParameterPaths: getSsmParameterPaths(stage),

    // Event Bus Object
    eventBusName: EVENT_BUS_NAME,

    // StageName
    stageName: stage,
  };

  if (stage === 'PROD') {
    return {
      ...baseParams,
      analysisGlueArtefactsBucketName: ANALYSIS_GLUE_ARTEFACTS_BUCKET_NAME[stage],
    };
  }

  return baseParams;
};
