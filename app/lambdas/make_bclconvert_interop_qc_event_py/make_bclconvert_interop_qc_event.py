#!/usr/bin/env python3

"""
Make BCLConvert InteropQC events list
"""
# Standard imports
import json
from os import environ
from typing import List, Dict, Any, Literal

# Layer imports
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.sequence import (
    get_sequence_object_from_instrument_run_id,
    get_library_id_list_in_sequence
)
from analysis_tool_kit import add_workflow_draft_event_detail, Workflow

# Type hints
WorkflowName = Literal['BCLCONVERT_INTEROP_QC']

# Globals
WORKFLOW_OBJECT_DICT: Dict[WorkflowName, Workflow] = {
    "BCLCONVERT_INTEROP_QC": json.loads(
        get_ssm_value(environ['BCLCONVERT_INTEROP_QC_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

PAYLOAD_VERSION_DICT: Dict[WorkflowName, str] = {
    "BCLCONVERT_INTEROP_QC": get_ssm_value(environ['BCLCONVERT_INTEROP_QC_PAYLOAD_VERSION_SSM_PARAMETER_NAME']),
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

    default_draft_event_detail = add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECT_DICT['BCLCONVERT_INTEROP_QC']
    )

    # Add payload data details
    default_draft_event_detail.update({
        "payload": {
            "version": PAYLOAD_VERSION_DICT['BCLCONVERT_INTEROP_QC'],
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
    })

    return default_draft_event_detail


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
