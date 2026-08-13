# Project Structure

```
.
├── app/                              # Application logic (runs independently)
│   ├── lambdas/                      # Python Lambda functions
│   │   └── <lambda_name>_py/         # Each lambda in its own directory
│   │       └── <lambda_name>.py      # Handler file (exports `handler(event, context)`)
│   ├── layers/                       # Shared Python Lambda layers
│   │   └── analysis_tool_kit/        # Primary shared layer
│   │       ├── pyproject.toml        # Poetry dependencies
│   │       └── src/analysis_tool_kit/ # Layer source code
│   └── step-functions-templates/     # ASL JSON state machine definitions
│       └── *.asl.json                # Templates with ${__placeholder__} substitution
├── infrastructure/                   # CDK infrastructure code (TypeScript)
│   ├── stage/                        # Per-environment stacks
│   │   ├── config.ts                 # Environment-specific configuration builder
│   │   ├── constants.ts              # Workflow versions, SSM paths, event bus names
│   │   ├── interfaces.ts             # TypeScript interfaces for stack configs
│   │   ├── stateless-application-stack.ts  # Main stateless stack
│   │   ├── stateful-application-stack.ts   # Stateful resources stack
│   │   ├── event-rules/              # EventBridge rule constructs
│   │   ├── event-targets/            # EventBridge target constructs
│   │   ├── lambdas/                  # Lambda construct definitions
│   │   ├── s3/                       # S3 bucket constructs
│   │   ├── ssm/                      # SSM parameter constructs
│   │   ├── step-functions/           # Step Function constructs
│   │   └── utils/                    # Shared infrastructure utilities
│   └── toolchain/                    # CodePipeline deployment stacks
│       ├── stateless-stack.ts
│       └── stateful-stack.ts
├── bin/                              # CDK app entry point
│   └── deploy.ts                     # Initialises stateless/stateful root stacks
├── test/                             # CDK nag compliance tests (Jest)
├── docs/                             # Architecture diagrams (drawio, SVG exports)
└── Makefile                          # Common task shortcuts
```

## Conventions

- Lambda directories use the naming pattern `<descriptive_name>_py/` containing a single Python file with the same name
- Each lambda exports a `handler(event, context)` function
- Shared logic lives in the `analysis_tool_kit` layer, imported as a regular package
- Infrastructure construct modules expose a `buildAll*` function pattern (e.g., `buildAllLambdas`, `buildAllStepFunctions`)
- Step function templates use `${__variable__}` placeholders that are substituted at deploy time by CDK
- Configuration constants (workflow versions, SSM paths) are centralised in `infrastructure/stage/constants.ts`
- Environment differences (beta/gamma/prod) are handled through stage-specific config in `config.ts`
