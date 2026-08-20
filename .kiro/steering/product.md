# Product Overview

Analysis Glue is an event-driven orchestration service within the OrcaBus platform (University of Melbourne Centre for Cancer Research). It generates bioinformatics workflow drafts whenever new sequencing data becomes available.

## Core Concepts

- **Analysis Scaffolds**: Bare-minimum requirements for an analysis (typically just library IDs and analysis name). Eight scaffold types exist covering WGS, WTS, ctDNA, and combined analyses.
- **Workflow Drafts**: Pre-populated workflow run events in DRAFT status, emitted to EventBridge for downstream pipeline managers to pick up, enrich with remaining inputs, and execute.
- **Analysis Boundaries**: Secondary analyses (e.g., DRAGEN, OncoAnalyser) are never combined with tertiary analyses (e.g., Sash, RNASum) in the same execution.

## Supported Pipelines

- BCLConvert InterOp QC
- DRAGEN WGTS DNA (tumor-normal WGS)
- DRAGEN WGTS RNA (transcriptome)
- Arriba WGTS RNA (gene fusions)
- OncoAnalyser WGTS DNA / RNA / DNA+RNA
- Sash (somatic variant annotation)
- RNASum (RNA expression summarisation)
- DRAGEN TSO500 ctDNA
- PierianDx TSO500 ctDNA

## Event Flow

1. External trigger: `FastqListRowsAdded` from `orcabus.fastqglue`
2. Step Function splits samples by type (WGS, WTS, ctDNA)
3. Per-subject lambdas determine appropriate tumor/normal pairings
4. Workflow draft events emitted to `OrcaBusMain` EventBridge bus with source `orcabus.analysisglue`
