#!/usr/bin/env python3

"""
Helper functions for analysis workflows
"""

# Standard imports
from functools import reduce
from operator import concat
from typing import List, Any, cast, Unpack, Literal

# Layer imports
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id,
    list_workflows, get_workflow_runs_from_metadata
)
from orcabus_api_tools.workflow.models import WorkflowRunDetail
from orcabus_api_tools.fastq import get_fastqs_in_library

# Local imports
from .globals import DRAFT_STATUS
from .models import ReadSet, EventLibrary, Workflow

# Type hints
WorkflowsList = Literal['DRAGEN_TSO500_CTDNA']

# Functions
def flatten(list_of_lists: List[List[Any]]) -> List[Any]:
    return list(reduce(concat, list_of_lists, []))


def get_readsets_in_library(library_id: str) -> List[ReadSet]:
    return list(map(
        lambda fastq_id_iter_: cast(
            ReadSet,
            cast(object, {
                "orcabusId": fastq_id_iter_['id'],
                "rgid": ".".join([
                    fastq_id_iter_['index'], str(fastq_id_iter_['lane']),
                    fastq_id_iter_['instrumentRunId']
                ]),
            })
        ),
        get_fastqs_in_library(
            library_id=library_id
        )
    ))


def library_to_event_library(library: Library) -> EventLibrary:
    return {
        "orcabusId": library['orcabusId'],
        "libraryId": library['libraryId'],
        "readsets": get_readsets_in_library(library['libraryId']),
    }


def get_libraries_with_readsets(libraries: List[Library]) -> List[Library]:
    """
    Get the libraries that have readsets
    :param libraries:
    :return:
    """
    # Get all libraries with readsets
    libraries_with_readsets = list(map(
        library_to_event_library,
        libraries
    ))

    # Drop libraries without readsets
    return list(filter(
        lambda library_iter_: len(library_iter_['readsets']) > 0,
        libraries_with_readsets
    ))


def get_existing_workflow_runs(
    workflow_name: str,
    workflow_version: str,
    libraries: List[Library],
) -> List[WorkflowRunDetail]:
    """
    Get the existing workflow runs for a given workflow name/version and library/readset list
    :param workflow_name:
    :param workflow_version:
    :param libraries:
    :return:
    """
    return get_workflow_runs_from_metadata(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        library_id_list=list(map(
            lambda library_obj_iter_: library_obj_iter_['libraryId'],
            libraries
        )),
        rgid_list=list(map(
            lambda readset_iter_: readset_iter_['rgid'],
            # Flatten the readsets from all libraries
            flatten(
                list(map(
                    lambda library_obj_iter_: get_readsets_in_library(library_obj_iter_['libraryId']),
                    libraries
                ))
            )
        ))
    )


def add_workflow_draft_event_detail(
        libraries: List[Library],
        **kwargs: Unpack[Workflow]
):
    """
    Add the workflow draft event detail
    :param libraries:
    :param kwargs:
    :return:
    """
    # Get the workflow version from kwargs
    workflow_name = kwargs.pop('name')
    workflow_version = kwargs.pop('version')

    # Set the portal run id
    portal_run_id = create_portal_run_id()

    # Workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id
    )

    # Get the workflow object
    try:
        workflow = next(iter(
            list_workflows(
                workflow_name=workflow_name,
                workflow_version=workflow_version,
                code_version=kwargs.get("codeVersion", None),
                execution_engine=kwargs.get("executionEngine", None),
                execution_engine_pipeline_id=kwargs.get("executionEnginePipelineId", None),
                validation_state=kwargs.get("validationState", None),
            )
        ))
    except StopIteration:
        raise ValueError(
            f"Workflow {workflow_name} version {workflow_version} not found"
        )

    return {
        "status": DRAFT_STATUS,
        "workflow": workflow,
        "workflowRunName": workflow_run_name,
        "portalRunId": portal_run_id,
        "libraries": get_libraries_with_readsets(libraries)
    }
