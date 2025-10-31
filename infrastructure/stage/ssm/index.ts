import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { BuildSsmParameterProps } from './interfaces';

import * as path from 'path';
import { camelCaseToKebabCase } from '../utils';

export function buildSsmParameters(scope: Construct, props: BuildSsmParameterProps) {
  /**
   * SSM Stack here
   *
   * */

  /**
   * Default workflow versions
   */
  // Default workflow versions
  for (const [key, value] of Object.entries(
    props.ssmParameterValues.workflowVersionsByWorkflowName
  )) {
    new ssm.StringParameter(scope, `versions-${key}`, {
      parameterName: path.join(
        props.ssmParameterPaths.workflowVersionsPrefix,
        camelCaseToKebabCase(key)
      ),
      stringValue: JSON.stringify(value),
    });
  }

  /**
   * Default payload versions
   */
  // Default payload versions
  for (const [key, value] of Object.entries(
    props.ssmParameterValues.payloadVersionsByWorkflowName
  )) {
    new ssm.StringParameter(scope, `payload-versions-${key}`, {
      parameterName: path.join(
        props.ssmParameterPaths.payloadVersionsPrefix,
        camelCaseToKebabCase(key)
      ),
      stringValue: value,
    });
  }
}
