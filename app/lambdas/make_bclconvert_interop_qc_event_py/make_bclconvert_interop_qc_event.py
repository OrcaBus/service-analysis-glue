#!/usr/bin/env python3

"""
Make BCLConvert InteropQC events list
"""
# Standard imports
import json
from os import environ
from typing import List, Dict, Any, TypedDict, cast, NotRequired, Unpack, Literal

# Layer imports
from orcabus_api_tools.fastq import get_fastqs_in_library
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library, LibraryBase
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id,
    list_workflows
)
from orcabus_api_tools.sequence import (
    get_sequence_object_from_instrument_run_id,
    get_library_id_list_in_sequence
)

# Type hints
WorkflowName = Literal['BCLCONVERT_INTEROP_QC']

class Workflow(TypedDict):
    name: str
    version: str
    codeVersion: NotRequired[str]
    executionEngine: NotRequired[str]
    executionEnginePipelineId: NotRequired[str]
    validationState: NotRequired[str]


class ReadSet(TypedDict):
    orcabusId: str
    rgid: str


class EventLibrary(LibraryBase):
    readsets: List[ReadSet]


# Globals
WORKFLOW_OBJECT_DICT: Dict[WorkflowName, Workflow] = {
    "BCLCONVERT_INTEROP_QC": json.loads(get_ssm_value(environ['BCLCONVERT_INTEROP_QC_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

PAYLOAD_VERSION_DICT: Dict[WorkflowName, str] = {
    "BCLCONVERT_INTEROP_QC": get_ssm_value(environ['BCLCONVERT_INTEROP_QC_PAYLOAD_VERSION_SSM_PARAMETER_NAME']),
}

DRAFT_STATUS = "DRAFT"


def library_to_event_library(library: Library) -> EventLibrary:
    return {
        "orcabusId": library['orcabusId'],
        "libraryId": library['libraryId'],
        "readsets": list(map(
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
                library_id=library['libraryId']
            )
        )),
    }


def add_workflow_draft_event_detail(
        libraries: List[Library],
        instrument_run_id: str,
        payload_version: str = None,
        **kwargs: Unpack[Workflow]
):
    # Get the workflow name and version from kwargs
    workflow_name = kwargs.pop('name')
    workflow_version = kwargs.pop('version')

    # Create the portal run id
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
        raise ValueError(f"Workflow {workflow_name} version {workflow_version} not found")

    return {
        "status": DRAFT_STATUS,
        "workflow": workflow,
        "workflowRunName": workflow_run_name,
        "portalRunId": portal_run_id,
        "libraries": list(map(
            library_to_event_library,
            libraries
        )),
        "payload": {
            "version": payload_version,
            "data": {
                "tags": {
                    "instrumentRunId": instrument_run_id,
                    "libraryIdList": list(map(
                        lambda library_obj_iter_: library_obj_iter_['libraryId'],
                        libraries
                    ))
                }
            }
        }
    }


def add_bclconvert_interop_qc_draft_event(
        instrument_run_id: str,
        libraries: List[Library],
):
    """
    Add the bclconvert interop qc draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event_detail(
        libraries=libraries,
        instrument_run_id=instrument_run_id,
        payload_version=PAYLOAD_VERSION_DICT['BCLCONVERT_INTEROP_QC'],
        **WORKFLOW_OBJECT_DICT['BCLCONVERT_INTEROP_QC']
    )


def generate_bclconvert_interop_qc_draft(
        instrument_run_id: str,
        libraries: List[Library],
) -> Dict[str, Any]:
    return add_bclconvert_interop_qc_draft_event(
        instrument_run_id=instrument_run_id,
        libraries=libraries
    )


def handler(event, context):
    """
    Get the library id list
    :param event:
    :param context:
    :return:
    """

    # Get the library id list
    instrument_run_id = event.get("instrumentRunId")

    # Get the libraries as library objects
    library_id_list = get_library_id_list_in_sequence(
        get_sequence_object_from_instrument_run_id(
            instrument_run_id=instrument_run_id
        )['orcabusId']
    )

    libraries_list = get_libraries_list_from_library_id_list(
        library_id_list=library_id_list
    )

    return {
        "eventDetail": generate_bclconvert_interop_qc_draft(
            instrument_run_id,
            libraries_list
        )
    }

# if __name__ == "__main__":
#     import json
#     print(
#         json.dumps(
#             handler(
#                 {
#                     "libraryIdList": [
#                         "L2401527"
#                     ]
#                 },
#                 None
#             ),
#             indent=4
#     ))
