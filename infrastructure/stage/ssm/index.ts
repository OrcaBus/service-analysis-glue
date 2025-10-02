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
   * Define the workflow names
   */

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
      stringValue: value,
    });
  }
}
