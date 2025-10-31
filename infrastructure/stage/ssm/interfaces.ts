import { WorkflowPayloadVersionType, WorkflowsObjectType } from '../interfaces';

export interface SsmParameterValues {
  workflowVersionsByWorkflowName: WorkflowsObjectType;
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
