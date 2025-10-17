import { WorkflowPayloadVersionType, WorkflowVersionObjectType } from '../interfaces';

export interface SsmParameterValues {
  workflowVersionsByWorkflowName: WorkflowVersionObjectType;
  payloadVersionsByWorkflowName: WorkflowPayloadVersionType;
}

export interface SsmParameterPaths {
  rootPrefix: string;
  workflowVersionsPrefix: string;
  payloadVersionsPrefix: string;
}

export interface BuildSsmParameterProps {
  ssmParameterValues: SsmParameterValues;
  ssmParameterPaths: SsmParameterPaths;
}
