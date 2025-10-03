# Analysis Glue

## Overview

Generate an appropriate suite of workflow drafts whenever new primary data is available.

This is a large service, while only one external event triggers the application
many different events are generated and consumed within the application.

This service introduces the concept of analysis scaffolds and 'workflow drafts'.

Analysis Scaffolds are 'bare-minimum' requirements for an analysis to be generated.

This often comprises just the library id (two for somatic analyses) and the analysis name.

We also make the effort to prevent analyses crossing 'analysis-boundaries'.

This means, no tertiary analyses are run with secondary analyses.

We also do not combine workflows just because they have the same trigger point, i.e
oncoanalyser WGTS DNA+RNA is not run as part of the same analysis as RNASum.

## Events Overview

![Events Overview](./docs/drawio-exports/analysis-glue.drawio.svg)

### Analysis Scaffold Events

We generate eight different types of analysis scaffolds (umccrise not shown above).

#### WGTS DNA Secondary Analysis :construction:

```json5
{
  "EventBusName": "OrcaBusMain",
  "EventDetailType": "AnalysisScaffoldCreated",
  // Application listens to all sources including itself
  "Source": "umccr.analysisglue",
  "Detail": {
    "analysisName": "wgts-dna-secondary-analysis",
    "analysisRunName": "<tumor_library_id>__<normal_library_id>",
    "payload": {
      "tumorLibraryId": "<tumor_library_id>",
      "normalLibraryId": "<normal_library_id>",
    },
    "includeSteps": [
      "dragen-wgts-dna",
      "oncoanalyser-wgts-dna",
    ]
  }
}
```

### Workflow Draft Events

The analysis glue services for each analysis type will then generate workflow drafts.

For some workflows, such as Dragen WGTS DNA, this will mean everything can be generated
except for the fastq list row objects. Instead we can provide the RGID list for both
tumor and normal libraries in the tags section and leave it up to the dragen-wgts-dna pipeline manager
to generate the fastq list rows as they become available, and then also generate the READY event.

Other services such as RNASum will not have any inputs generated at all.
It is still up to the RNASum pipeline manager to update these inputs as they become available,
by subscribing to the workflow manager events.

This might mean subscribing to the workflow manager events for:
   * dragen wgts rna workflow completions to update the dragenTranscriptomeUri and arribaUri inputs
   * subscribing to umccrise events for the umccriseUri input

The RNASum service will also need to subscribe to its own draft events to convert them to 'READY'.


#### Dragen WGTS DNA :construction:

<detail>

<summary>Click to expand!</summary>

```json5
{
  "EventBusName": "OrcaBusMain",
  "Source": "orcabus.analysisglue",
  "DetailType": "WorkflowRunStateChange",
  "Detail": {
    "portalRunId": "20250516abcdef01",  // pragma: allowlist secret
    "timestamp": "2025-05-15T07:25:56+00:00",
    "status": "DRAFT",
    "workflowName": "dragen-wgts-dna",
    "workflowVersion": "4.4.1",
    "workflowRunName": "umccr--automated--tumor-normal--4-4-1--20250516abcdef01",
    "linkedLibraries": [
      {
        "libraryId": "L2500001",
        "orcabusId": "lib.01JTG6TR3N6YB0VVY17J891S8D"
      },
      {
        "libraryId": "L2000164",
        "orcabusId": "lib.01JBMTKCG1ES53W6CPRKTT6EY9"
      }
    ],
    "payload": {
      "version": "2024.07.23",
      "data": {
        "inputs": {
          "enableDuplicateMarking": true,
          "enableCnvSomatic": true,
          "enableHrdSomatic": true,
          "enableSvSomatic": true,
          "cnvUseSomaticVcBaf": true,
          "outputPrefixSomatic": "L2500001",
          "outputPrefixGermline": "L2000164",
          "tumorFastqListRows": null,
          "normalFastqListRows": null,
        },
        "engineParameters": {
          "outputUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/analysis/dragen-wgts-dna/20250516abcdefgh/",
          "logsUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/logs/dragen-wgts-dna/20250516abcdefgh/",
          "cacheUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/cache/dragen-wgts-dna/20250516abcdefgh/",
          "projectId": "eba5c946-1677-441d-bbce-6a11baadecbb"
        },
        "tags": {
          "individualId": "SBJ00306",
          "subjectId": "CASE-2025",
          "tumorLibraryId": "L2500001",
          "tumorFastqListRowRgidList": [
            "CCGCGGTT+CTAGCGCT.3.250509_A01052_0262_BHFGJWDSXF"
          ],
          "normalLibraryId": "L2000164",
          "normalFastqListRowRgidList": [
            "TATCGCAC+CTTAGTGT.1.200402_A01052_0008_BH5LWFDSXY"
          ]
        }
      }
    }
  }
}
```

</detail>

#### RNASum Draft Event Construction

<detail>

<summary>Click to expand!</summary>

```json5
{
  "EventBusName": "OrcaBusMain",
  "Source": "orcabus.analysisglue",
  "DetailType": "WorkflowRunStateChange",
  "Detail": {
    "portalRunId": "20250516abcdef01",  // pragma: allowlist secret
    "timestamp": "2025-05-15T07:25:56+00:00",
    "status": "DRAFT",
    "workflowName": "rnasum",
    "workflowVersion": "1.0.0",
    "workflowRunName": "umccr--automated--tumor-normal--1-0-0--20250516abcdef01",
    "linkedLibraries": [
      {
        "libraryId": "L2500001",
        "orcabusId": "lib.ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      },
      {
        "libraryId": "L2500002",
        "orcabusId": "lib.BBCDEFGHIJKLMNOPQRSTUVWXYZ"
      },
      {
        "libraryId": "L2500003",
        "orcabusId": "lib.CBCDEFGHIJKLMNOPQRSTUVWXYZ"
      },
    ],
    "payload": {
      "version": "2024.07.23",
      "data": {
        "inputs": {
          "arribaUri": null,
          "dragenTranscriptomeUri": null,
          "umccriseUri": null,
          "wtsTumorLibraryId": "L2500003",
          "subjectId": "SBJ02025"
        },
        "engineParameters": {
          "outputUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/analysis/rnasum/20250516abcdefgh/",
          "logsUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/logs/rnasum/20250516abcdefgh/",
          "cacheUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/cache/rnasum/20250516abcdefgh/",
          "projectId": "eba5c946-1677-441d-bbce-6a11baadecbb"
        },
        "tags": {
          "individualId": "SBJ02025",
          "subjectId": "CASE-2025",
          "tumorDnaLibraryId": "L2500001",
          "tumorDnaFastqListRowRgidList": [
            "CCGCGGTT+CTAGCGCT.3.250509_A01052_0262_BHFGJWDSXF"
          ],
          "normalDnaLibraryId": "L2500002",
          "normalDnaFastqListRowRgidList": [
            "TATCGCAC+CTTAGTGT.1.200402_A01052_0008_BH5LWFDSXY"
          ],
          "tumorRnaLibraryId": "L2500003",
          "tumorRnaFastqListRowRgidList": [
            "CCGCGGTT+CTAGCGCT.3.250509_A01052_0262_BHFGJWDSXF"
          ],
        }
      }
    }
  }
}
```

</detail>

## Step Functions


We have a lot of steps here. This is because we split out the analysis scaffold creation
and workflow draft creation into two separate steps.

This means that different entry points can use the workflow draft creation step functions
to generate an array of analyses.

### Analysis Scaffold Creation Step Function

![Analysis Scaffold Creation Step Function](./docs/workflow-studio-exports/analysis-builder-sfn.svg)

### Workflow Draft Creation Step Functions

We create workflow drafts for both secondary and tertiary analyses.

#### WGTS DNA Secondary Analysis

![Dragen WGTS DNA Workflow Draft Creation Step Function](./docs/workflow-studio-exports/wgts-dna_secondary-analysis.svg)

#### WGTS RNA Secondary Analysis

![Dragen WGTS RNA Workflow Draft Creation Step Function](./docs/workflow-studio-exports/wgts-rna_secondary-analysis.svg)

#### TSO500 ctDNA Secondary Analysis

![TSO500 ctDNA Workflow Draft Creation Step Function](./docs/workflow-studio-exports/tso500-ctdna_secondary-analysis.svg)

#### WGTS DNA+RNA Tertiary Analysis

![WGTS DNA+RNA Workflow Draft Creation Step Function](./docs/workflow-studio-exports/wgts-dna-rna_tertiary-analysis.svg)


#### RNASum Tertiary Analysis

![RNASum Workflow Draft Creation Step Function](./docs/workflow-studio-exports/rnasum_tertiary-analysis.svg)


#### Sash Tertiary Analysis

![Sash Workflow Draft Creation Step Function](./docs/workflow-studio-exports/sash_tertiary-analysis.svg)


#### PierianDx Tertiary Analysis

![PierianDx Workflow Draft Creation Step Function](./docs/workflow-studio-exports/pieriandx_tertiary-analysis.svg)


## Project Structure

The project is organized into the following key directories:

- **`./app`**: Contains the main application logic. You can open the code editor directly in this folder, and the application should run independently.

- **`./bin/deploy.ts`**: Serves as the entry point of the application. It initializes two root stacks: `stateless` and `stateful`. You can remove one of these if your service does not require it.

- **`./infrastructure`**: Contains the infrastructure code for the project:
  - **`./infrastructure/toolchain`**: Includes stacks for the stateless and stateful resources deployed in the toolchain account. These stacks primarily set up the CodePipeline for cross-environment deployments.
  - **`./infrastructure/stage`**: Defines the stage stacks for different environments:
    - **`./infrastructure/stage/config.ts`**: Contains environment-specific configuration files (e.g., `beta`, `gamma`, `prod`).
    - **`./infrastructure/stage/stack.ts`**: The CDK stack entry point for provisioning resources required by the application in `./app`.

- **`.github/workflows/pr-tests.yml`**: Configures GitHub Actions to run tests for `make check` (linting and code style), tests defined in `./test`, and `make test` for the `./app` directory. Modify this file as needed to ensure the tests are properly configured for your environment.

- **`./test`**: Contains tests for CDK code compliance against `cdk-nag`. You should modify these test files to match the resources defined in the `./infrastructure` folder.

## Setup

### Requirements

```sh
node --version
v22.9.0

# Update Corepack (if necessary, as per pnpm documentation)
npm install --global corepack@latest

# Enable Corepack to use pnpm
corepack enable pnpm

```

### Install Dependencies

To install all required dependencies, run:

```sh
make install
```

### CDK Commands

You can access CDK commands using the `pnpm` wrapper script.

This template provides two types of CDK entry points: `cdk-stateless` and `cdk-stateful`.

- **`cdk-stateless`**: Used to deploy stacks containing stateless resources (e.g., AWS Lambda), which can be easily redeployed without side effects.
- **`cdk-stateful`**: Used to deploy stacks containing stateful resources (e.g., AWS DynamoDB, AWS RDS), where redeployment may not be ideal due to potential side effects.

The type of stack to deploy is determined by the context set in the `./bin/deploy.ts` file. This ensures the correct stack is executed based on the provided context.

For example:

```sh
# Deploy a stateless stack
pnpm cdk-stateless <command>

# Deploy a stateful stack
pnpm cdk-stateful <command>
```

### Stacks

This CDK project manages multiple stacks. The root stack (the only one that does not include `DeploymentPipeline` in its stack ID) is deployed in the toolchain account and sets up a CodePipeline for cross-environment deployments to `beta`, `gamma`, and `prod`.

To list all available stacks, run:

```sh
pnpm cdk-stateless ls
```

Example output:

```sh
OrcaBusStatelessServiceStack
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusBeta/DeployStack (OrcaBusBeta-DeployStack)
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusGamma/DeployStack (OrcaBusGamma-DeployStack)
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusProd/DeployStack (OrcaBusProd-DeployStack)
```

## Linting and Formatting

### Run Checks

To run linting and formatting checks on the root project, use:

```sh
make check
```

### Fix Issues

To automatically fix issues with ESLint and Prettier, run:

```sh
make fix
```
