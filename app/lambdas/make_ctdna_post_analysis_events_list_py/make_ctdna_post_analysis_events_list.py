#!/usr/bin/env python3

"""
Make a list of events from a list of libraries

If there are multiple tumors, we create a WGS analysis list for each tumor, finding the latest normal

If there is just one normal, we find the latest tumor for that subject.

We do not expect the case for there to be multiple tumors and multiple normals for a subject on a given run
"""
# Standard imports
import json
from os import environ
from typing import List, Dict, Any, Literal
import logging

# Layer imports
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.workflow.models import Workflow
from analysis_tool_kit import (
    get_existing_workflow_runs,
    add_workflow_draft_event_detail
)

# Set logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Type hints
WorkflowName = Literal['PIERIANDX_TSO500_CTDNA']

# Globals
WORKFLOW_OBJECTS_DICT: Dict[WorkflowName, Workflow] = {
    "PIERIANDX_TSO500_CTDNA": json.loads(get_ssm_value(environ['PIERIANDX_TSO500_CTDNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

# Draft status
DRAFT_STATUS = "DRAFT"


def add_pieriandx_tso500_ctdna_draft_event(
        libraries: List[Library],
):
    """
    Add the pieriandx tso500 ctdna draft event
    :param libraries:
    :return:
    """
    # Check that we have not had any other runs for this library and these readsets
    if len(libraries) != 1:
        raise ValueError(
            "PierianDx TSO500 ctDNA draft event requires exactly one library"
        )

    # Check for existing runs
    existing_workflow_runs = get_existing_workflow_runs(
        workflow_name=WORKFLOW_OBJECTS_DICT['PIERIANDX_TSO500_CTDNA']['name'],
        workflow_version=WORKFLOW_OBJECTS_DICT['PIERIANDX_TSO500_CTDNA']['version'],
        libraries=libraries
    )

    if len(existing_workflow_runs) > 0:
        logger.warning(
            "Existing PierianDx TSO500 ctDNA workflow runs found for library: %s" % libraries[0]['libraryId']
        )
        return None

    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['PIERIANDX_TSO500_CTDNA'],
    )


def generate_ctdna_post_processing_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
    """
    Generate the ctdna post processing draft lists
    :param libraries:
    :return:
    """
    return [
        add_pieriandx_tso500_ctdna_draft_event(libraries),
    ]


def handler(event, context):
    """
    Get the library id list
    :param event:
    :param context:
    :return:
    """

    # Get the library id list
    library_id_list = event.get("libraryIdList", [])

    # Get the libraries as library objects
    libraries_list: List[Library] = get_libraries_list_from_library_id_list(
        library_id_list
    )

    # We only need the ctdna tumor libraries
    tumor_libraries = list(filter(
        lambda library_iter_: (
            library_iter_['phenotype'] == 'tumor' and
            library_iter_['type'] == 'ctDNA'
        ),
        libraries_list
    ))

    events_list = []
    for library_iter in tumor_libraries:
        # Add the ctdna draft event
        events_list.extend(
            generate_ctdna_post_processing_draft_lists([library_iter])
        )


    return {
        "eventDetailList": events_list
    }
