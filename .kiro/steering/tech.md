# Tech Stack

## Infrastructure (TypeScript)

- **AWS CDK** v2 with `aws-cdk-lib` and `constructs`
- **Platform constructs**: `@orcabus/platform-cdk-constructs` (shared account config, deployment patterns)
- **Lambda Python layer**: `@aws-cdk/aws-lambda-python-alpha` for bundling Python lambdas with Poetry
- **TypeScript**: v5.x, target ES2020, strict mode, commonjs modules
- **Package manager**: pnpm (v11.x, managed via Corepack)
- **Linting**: ESLint v10 + typescript-eslint
- **Formatting**: Prettier
- **Testing (CDK)**: Jest + ts-jest, tests validate CDK compliance with cdk-nag
- **Pre-commit hooks**: detect-secrets, black (Python), ggshield

## Application Logic (Python)

- **Runtime**: Python 3.14
- **Lambda layer**: `analysis_tool_kit` (Poetry-managed, in `app/layers/`)
- **Layer dependencies**: `verboselogs`, `orcabus_api_tools` (provides metadata/workflow/fastq API clients)
- **Type checking**: TypedDict-based models, mypy-boto3 stubs for dev
- **Step Functions**: ASL JSON templates with JSONata expressions (`{% %}` syntax), variable substitution via `${__placeholder__}`

## Deployment

- AWS CodePipeline for cross-environment deployments (beta → gamma → prod)
- Separate stateless and stateful stacks
- CDK context flag `deployMode` switches between stack types

## Common Commands

```bash
# Install all dependencies
make install

# Run linting + formatting + pre-commit checks
make check

# Auto-fix lint and formatting issues
make fix

# Run CDK/Jest tests
make test
# or: pnpm test

# List CDK stacks
pnpm cdk-stateless ls

# Synth/deploy stateless resources
pnpm cdk-stateless synth
pnpm cdk-stateless deploy

# Synth/deploy stateful resources
pnpm cdk-stateful synth
pnpm cdk-stateful deploy
```
