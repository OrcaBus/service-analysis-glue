import {
  EVENT_BUS_NAME,
  SSM_PARAMETER_PATH_PREFIX,
  NEW_WORKFLOW_MANAGER_IS_DEPLOYED,
  CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME,
  SSM_PARAMETER_PATH_WORKFLOW_VERSION_PREFIX,
  SSM_PARAMETER_PATH_PAYLOAD_VERSION_PREFIX,
  PAYLOAD_VERSIONS_BY_NAME,
} from './constants';
import { StatefulApplicationStackConfig, StatelessApplicationStackConfig } from './interfaces';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';

/**
 * Stateful stack properties for the workflow.
 * Mainly just linking values from SSM parameters
 * @param stage
 */

export const getSsmParameterValues = (stage: StageName): SsmParameterValues => {
  return {
    workflowVersionsByWorkflowName: CURRENT_WORKFLOW_OBJECTS_BY_WORKFLOW_NAME[stage],
    payloadVersionsByWorkflowName: PAYLOAD_VERSIONS_BY_NAME[stage],
  };
};

export const getSsmParameterPaths = (): SsmParameterPaths => {
  return {
    rootPrefix: SSM_PARAMETER_PATH_PREFIX,
    workflowVersionsPrefix: SSM_PARAMETER_PATH_WORKFLOW_VERSION_PREFIX,
    payloadVersionsPrefix: SSM_PARAMETER_PATH_PAYLOAD_VERSION_PREFIX,
  };
};

export const getStatefulStackProps = (stage: StageName): StatefulApplicationStackConfig => {
  return {
    // SSM Parameter Paths
    ssmParameterPaths: getSsmParameterPaths(),

    // SSM Parameter Values
    ssmParameterValues: getSsmParameterValues(stage),
  };
};

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    // SSM Parameter Paths
    ssmParameterPaths: getSsmParameterPaths(),

    // Event Bus Object
    eventBusName: EVENT_BUS_NAME,

    // Is new workflow manager deployed
    isNewWorkflowManagerDeployed: NEW_WORKFLOW_MANAGER_IS_DEPLOYED[stage],
  };
};
