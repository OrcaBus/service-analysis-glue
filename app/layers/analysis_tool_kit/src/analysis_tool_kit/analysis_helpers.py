#!/usr/bin/env python3

"""
Helper functions for analysis workflows
"""

# Standard imports
import copy
from functools import reduce
from operator import concat
from typing import List, Any, cast, Unpack, Literal, Optional

# Layer imports
from orcabus_api_tools.fastq.models import Fastq
from orcabus_api_tools.fastq import get_fastqs_in_library_list
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id,
    list_workflows,
    get_workflow_runs_from_metadata,
)
from orcabus_api_tools.workflow.models import (
    WorkflowRunDetail,
    ExecutionEngineType,
    ValidationStateType,
)
from orcabus_api_tools.fastq import (
    get_fastqs_in_library,
    get_fastqs_in_libraries_and_instrument_run_id,
)

# Local imports
from .globals import DRAFT_STATUS, DEPRECATED_STATUS
from .models import ReadSet, EventLibrary, Workflow, Payload

# Type hints
WorkflowsList = Literal['DRAGEN_TSO500_CTDNA']

# Map of the engineParameters "*UriPrefix" keys to their resolved "*Uri" keys.
# The prefix value is a directory prefix (ending in '/'); the resolved value
# appends the portal run id (with a trailing slash) to give the run-specific uri.
ENGINE_PARAMETER_URI_PREFIX_KEYS = {
    "logsUriPrefix": "logsUri",
    "cacheUriPrefix": "cacheUri",
    "outputUriPrefix": "outputUri",
}


# Functions
def flatten(list_of_lists: List[List[Any]]) -> List[Any]:
    return list(reduce(concat, list_of_lists, []))


def resolve_engine_parameter_uri_prefixes(
    payload: Payload,
    portal_run_id: str,
) -> Payload:
    """
    Resolve the "*UriPrefix" engineParameters into run-specific "*Uri" values.

    Each prefix (e.g. logsUriPrefix) is a directory prefix ending in '/'.
    The resolved uri (e.g. logsUri) is '<prefix><portal_run_id>/'.
    :param payload: The payload containing data.engineParameters
    :param portal_run_id: The portal run id to append to each prefix
    :return: A new payload with the resolved uri keys
    """
    payload = copy.deepcopy(payload)

    engine_parameters = payload.get("data", {}).get("engineParameters")
    if not engine_parameters:
        return payload

    for prefix_key, uri_key in ENGINE_PARAMETER_URI_PREFIX_KEYS.items():
        if prefix_key not in engine_parameters:
            continue
        prefix_value = engine_parameters.pop(prefix_key)
        engine_parameters[uri_key] = f"{prefix_value}{portal_run_id}/"

    return payload


def get_readsets_in_library(
        library_id: str,
        instrument_run_id: Optional[str] = None,
        fastq_obj_list: Optional[List[Fastq]] = None,
) -> List[ReadSet]:
    if fastq_obj_list is None:
        if instrument_run_id is None:
            fastq_obj_list = get_fastqs_in_library(
                library_id=library_id
            )
        else:
            fastq_obj_list = get_fastqs_in_libraries_and_instrument_run_id(
                instrument_run_id=instrument_run_id,
                library_id_list=[library_id]
            )
    else:
        fastq_obj_list = list(filter(
            lambda fastq_obj: fastq_obj['library']['libraryId'] == library_id,
            fastq_obj_list
        ))

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
        fastq_obj_list
    ))


def get_readsets_in_libraries(library_id_list: List[str], instrument_run_id: Optional[str] = None) -> List[ReadSet]:
    if instrument_run_id is None:
        fastq_obj_list = get_fastqs_in_library_list(
            library_id_list=library_id_list
        )
    else:
        fastq_obj_list = get_fastqs_in_libraries_and_instrument_run_id(
            instrument_run_id=instrument_run_id,
            library_id_list=library_id_list
        )

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
        fastq_obj_list
    ))


def library_to_event_library(
        library: Library,
        instrument_run_id: Optional[str] = None,
        fastq_obj_list: Optional[List[Fastq]] = None,
) -> EventLibrary:
    return {
        "orcabusId": library['orcabusId'],
        "libraryId": library['libraryId'],
        "readsets": get_readsets_in_library(
            library['libraryId'],
            instrument_run_id=instrument_run_id,
            fastq_obj_list=fastq_obj_list,
        ),
    }


def get_libraries_with_readsets(libraries: List[Library], instrument_run_id: Optional[str] = None) -> List[EventLibrary]:
    """
    Get the libraries that have readsets
    :param libraries:
    :param instrument_run_id:
    :return:
    """
    fastq_obj_list = get_fastqs_in_libraries_and_instrument_run_id(
        instrument_run_id=instrument_run_id,
        library_id_list=[library['libraryId'] for library in libraries]
    )

    # Get all libraries with readsets
    libraries_with_readsets = list(map(
        lambda library_obj_iter_: (
            library_to_event_library(
                library_obj_iter_,
                instrument_run_id=instrument_run_id,
                fastq_obj_list=fastq_obj_list,
            )
        ),
        libraries
    ))

    # Drop and return libraries without readsets
    return list(filter(
        lambda library_iter_: len(library_iter_['readsets']) > 0,
        libraries_with_readsets
    ))


def get_existing_workflow_runs(
    workflow_name: str,
    workflow_version: str,
    libraries: List[Library],
    instrument_run_id: Optional[str] = None,
) -> List[WorkflowRunDetail]:
    """
    Get the existing workflow runs for a given workflow name/version and library/readset list
    :param workflow_name:
    :param workflow_version:
    :param libraries:
    :param instrument_run_id:
    :return:
    """
    # Get workflow runs
    workflow_runs = get_workflow_runs_from_metadata(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        library_id_list=list(map(
            lambda library_obj_iter_: library_obj_iter_['libraryId'],
            libraries
        )),
        rgid_list=list(map(
            lambda readset_iter_: readset_iter_['rgid'],
            # Flatten the readsets from all libraries
            get_readsets_in_libraries(**dict(filter(
                lambda kv_iter_: kv_iter_[1] is not None,
                {
                    "library_id_list": list(map(
                        lambda library_obj_iter_: library_obj_iter_['libraryId'],
                        libraries
                    )),
                    "instrument_run_id": instrument_run_id
                }.items()
            )))
        ))
    )

    # Remove workflows with DEPRECATED status
    return list(filter(
        lambda workflow_run_iter_: not workflow_run_iter_['currentState']['status'] == DEPRECATED_STATUS,
        workflow_runs
    ))


def add_workflow_draft_event_detail(
        libraries: List[Library],
        payload: Optional[Payload] = None,
        workflow_run_prefix: Optional[str] = None,
        **kwargs: Unpack[Workflow]
):
    """
    Add the workflow draft event detail
    :param libraries:
    :param payload
    :param workflow_run_prefix:
    :param kwargs:
    :return:
    """
    # Get the workflow version from kwargs
    workflow_name = kwargs['name']
    workflow_version = kwargs['version']

    # Set the portal run id
    portal_run_id = create_portal_run_id()

    # Resolve the "*UriPrefix" engineParameters into run-specific "*Uri" values
    # (i.e '<prefix><portal_run_id>/') now that we have the portal run id.
    if payload is not None:
        payload = resolve_engine_parameter_uri_prefixes(payload, portal_run_id)

    # Workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id,
        workflow_run_prefix=workflow_run_prefix,
    )

    # Get the workflow object
    try:
        workflow = next(iter(
            list_workflows(
                workflow_name=workflow_name,
                workflow_version=workflow_version,
                code_version=kwargs.get("codeVersion", None),
                execution_engine=cast(Optional[ExecutionEngineType], kwargs.get("executionEngine", None)),
                execution_engine_pipeline_id=kwargs.get("executionEnginePipelineId", None),
                validation_state=cast(Optional[ValidationStateType], kwargs.get("validationState", None)),
            )
        ))
    except StopIteration:
        raise ValueError(
            f"Workflow {workflow_name} version {workflow_version} not found"
        )

    return dict(filter(
        lambda kv_iter_: kv_iter_[1] is not None,
        {
            "status": DRAFT_STATUS,
            "workflow": workflow,
            "workflowRunName": workflow_run_name,
            "portalRunId": portal_run_id,
            "libraries": get_libraries_with_readsets(libraries),
            "payload": payload
        }.items()
    ))
