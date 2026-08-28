import {
  TestSamplePreDraftDataConfigurationsByWorkflowName,
  WorkflowPayloadVersionType,
  WorkflowsObjectType,
} from '../interfaces';

export interface SsmParameterValues {
  workflowVersionsByWorkflowName: WorkflowsObjectType;
  payloadVersionsByWorkflowName: WorkflowPayloadVersionType;
  preDraftDataConfigurations?: TestSamplePreDraftDataConfigurationsByWorkflowName;
  s3DeploymentSnapshotPrefix?: string;
  gitStacksToObserveList?: string[];
}

export interface SsmParameterPaths {
  rootPrefix: string;
  workflowVersionsPrefix: string;
  payloadVersionsPrefix: string;
  preDraftDataConfigurationsPrefix?: string;
  s3DeploymentSnapshot?: string;
  gitStacksToObserveList?: string;
}

export interface BuildSsmParameterProps {
  ssmParameterValues: SsmParameterValues;
  ssmParameterPaths: SsmParameterPaths;
}
