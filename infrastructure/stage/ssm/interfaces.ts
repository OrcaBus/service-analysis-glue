import { WorkflowObjectType } from '../interfaces';

export interface SsmParameterValues {
  workflowVersionsByWorkflowName: WorkflowObjectType;
}

export interface SsmParameterPaths {
  rootPrefix: string;
  workflowVersionsPrefix: string;
}

export interface BuildSsmParameterProps {
  ssmParameterValues: SsmParameterValues;
  ssmParameterPaths: SsmParameterPaths;
}
