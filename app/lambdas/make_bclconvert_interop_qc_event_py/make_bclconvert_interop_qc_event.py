#!/usr/bin/env python3

"""
Make BCLConvert InteropQC events list
"""

# Standard imports
from os import environ
from typing import List, Dict, Any

# Layer imports
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

# Globals
WORKFLOW_NAME_LIST = {
    "BCLCONVERT_INTEROP_QC": 'bclconvert-interop-qc',
}

WORKFLOW_VERSION_LIST = {
    "BCLCONVERT_INTEROP_QC": get_ssm_value(environ['BCLCONVERT_INTEROP_QC_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
}

PAYLOAD_VERSION_LIST = {
    "BCLCONVERT_INTEROP_QC": get_ssm_value(environ['BCLCONVERT_INTEROP_QC_PAYLOAD_VERSION_SSM_PARAMETER_NAME']),
}

DRAFT_STATUS = "DRAFT"


def library_to_base_library(library: Library) -> LibraryBase:
    return {
        "orcabusId": library['orcabusId'],
        "libraryId": library['libraryId'],
    }


def add_workflow_draft_event_detail(
        instrument_run_id: str,
        libraries: List[Library],
        workflow_name: str,
        workflow_version: str,
        payload_version: str = None,
):
    # Set the portal run id
    portal_run_id = create_portal_run_id()

    # Workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id
    )

    try:
        workflow = next(filter(
            lambda workflow_iter_: workflow_iter_.get("name") == workflow_name,
            list_workflows(
                workflow_name=workflow_name,
                workflow_version=workflow_version
            )
        ))
    except StopIteration:
        workflow = {
            "name": workflow_name,
            "version": workflow_version,
        }

    return {
        "status": DRAFT_STATUS,
        "workflow": workflow,
        "workflowRunName": workflow_run_name,
        "portalRunId": portal_run_id,
        "libraries": list(map(
            lambda library_obj_iter_: {
                "libraryId": library_obj_iter_['libraryId'],
                "orcabusId": library_obj_iter_['orcabusId']
            },
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
        workflow_name=WORKFLOW_NAME_LIST['BCLCONVERT_INTEROP_QC'],
        workflow_version=WORKFLOW_VERSION_LIST['BCLCONVERT_INTEROP_QC'],
        libraries=libraries,
        instrument_run_id=instrument_run_id,
        payload_version=PAYLOAD_VERSION_LIST['BCLCONVERT_INTEROP_QC'],
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
