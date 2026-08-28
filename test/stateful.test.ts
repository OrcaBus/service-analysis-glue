import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { SynthesisMessage } from 'aws-cdk-lib/cx-api';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import path from 'path';
import { StatefulApplicationStack } from '../infrastructure/stage/stateful-application-stack';
import { getStatefulStackProps } from '../infrastructure/stage/config';
import { camelCaseToKebabCase } from '../infrastructure/stage/utils';
import { SSM_PARAMETER_PATH_CONFIGURATIONS_PREFIX } from '../infrastructure/stage/constants';

function synthesisMessageToString(sm: SynthesisMessage): string {
  return `${sm.entry.data} [${sm.id}]`;
}

// Pick the PROD environment as it populates the pre-flight configurations
const prodStatefulProps = getStatefulStackProps('PROD');

describe('stateful-application-stack-ssm-parameters', () => {
  const app = new App({});
  const stack = new StatefulApplicationStack(app, 'TestStatefulStack', prodStatefulProps);
  const template = Template.fromStack(stack);

  // Collect all rendered SSM parameter names
  const ssmParameterNames = Object.values(template.findResources('AWS::SSM::Parameter')).map(
    (resource) => (resource as { Properties: { Name: string } }).Properties.Name
  );

  // The pre-flight configurations that must be deployed, derived from the actual config
  const preDraftDataConfigurations =
    prodStatefulProps.ssmParameterValues.preDraftDataConfigurations;

  test('pre-flight configurations are populated for PROD', () => {
    expect(preDraftDataConfigurations).toBeDefined();
    expect(Object.keys(preDraftDataConfigurations ?? {}).length).toBeGreaterThan(0);
  });

  // Assert each configured workflow renders a parameter at the expected kebab-cased path.
  // This guards against both the casing typo and the wrong-prop-lookup regressions.
  for (const workflowKey of Object.keys(preDraftDataConfigurations ?? {})) {
    const expectedParameterName = path.join(
      SSM_PARAMETER_PATH_CONFIGURATIONS_PREFIX,
      camelCaseToKebabCase(workflowKey)
    );

    test(`pre-flight parameter exists for '${workflowKey}' at ${expectedParameterName}`, () => {
      expect(ssmParameterNames).toContain(expectedParameterName);
    });
  }

  // Explicitly assert the two paths that previously went missing so the intent is documented.
  test('dragen-tso500-ctdna pre-flight parameter is deployed with correct casing', () => {
    expect(ssmParameterNames).toContain(
      '/orcabus/analysis-glue/pre-flight-configurations/dragen-tso500-ctdna'
    );
  });

  test('dragen-wgts-dna pre-flight parameter is deployed', () => {
    expect(ssmParameterNames).toContain(
      '/orcabus/analysis-glue/pre-flight-configurations/dragen-wgts-dna'
    );
  });
});

describe('cdk-nag-stateful-application-stack', () => {
  const app = new App({});
  const stack = new StatefulApplicationStack(app, 'NagStatefulStack', prodStatefulProps);

  Aspects.of(stack).add(new AwsSolutionsChecks());
  applyNagSuppression(stack);

  test('cdk-nag AwsSolutions Pack errors', () => {
    const errors = Annotations.fromStack(stack)
      .findError('*', Match.stringLikeRegexp('AwsSolutions-.*'))
      .map(synthesisMessageToString);
    expect(errors).toHaveLength(0);
  });

  test('cdk-nag AwsSolutions Pack warnings', () => {
    const warnings = Annotations.fromStack(stack)
      .findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'))
      .map(synthesisMessageToString);
    expect(warnings).toHaveLength(0);
  });
});

function applyNagSuppression(stack: Stack) {
  NagSuppressions.addStackSuppressions(
    stack,
    [{ id: 'AwsSolutions-S10', reason: 'not require requests to use SSL' }],
    true
  );
  NagSuppressions.addStackSuppressions(
    stack,
    [{ id: 'AwsSolutions-S1', reason: 'artefacts bucket does not require server access logs' }],
    true
  );
}
