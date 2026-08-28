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

  /**
   * Add the pre-draft data configurations
   */
  if (props.ssmParameterValues.preDraftDataConfigurations) {
    for (const [key, value] of Object.entries(
      props.ssmParameterValues.preDraftDataConfigurations
    )) {
      new ssm.StringParameter(scope, `pre-draft-data-configurations-${key}`, {
        parameterName: path.join(
          <string>props.ssmParameterPaths.preDraftDataConfigurationsPrefix,
          camelCaseToKebabCase(key)
        ),
        stringValue: JSON.stringify(value),
      });
    }
  }

  /**
   * Add the deployment snapshot S3 prefix (PROD only)
   */
  if (
    props.ssmParameterPaths.s3DeploymentSnapshot &&
    props.ssmParameterValues.s3DeploymentSnapshotPrefix
  ) {
    new ssm.StringParameter(scope, 'deployment-snapshot-s3-prefix', {
      parameterName: props.ssmParameterPaths.s3DeploymentSnapshot,
      stringValue: props.ssmParameterValues.s3DeploymentSnapshotPrefix,
    });
  }

  /**
   * Add the git stacks to observe list (PROD only)
   */
  if (
    props.ssmParameterPaths.gitStacksToObserveList &&
    props.ssmParameterValues.gitStacksToObserveList
  ) {
    new ssm.StringParameter(scope, 'git-stacks-to-observe', {
      parameterName: props.ssmParameterPaths.gitStacksToObserveList,
      stringValue: JSON.stringify(props.ssmParameterValues.gitStacksToObserveList),
    });
  }
}
