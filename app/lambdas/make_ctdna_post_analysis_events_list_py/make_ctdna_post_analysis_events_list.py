#!/usr/bin/env python3

"""
Make a list of events from a list of libraries

If there are multiple tumors, we create a WGS analysis list for each tumor, finding the latest normal

If there is just one normal, we find the latest tumor for that subject.

We do not expect the case for there to be multiple tumors and multiple normals for a subject on a given run
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
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id, list_workflows
)

# Globals
WORKFLOW_NAME_LIST = {
    "PIERIANDX_TSO500_CTDNA": "pieriandx-tso500-ctdna",
}

WORKFLOW_VERSION_LIST = {
    "PIERIANDX_TSO500_CTDNA": get_ssm_value(environ['PIERIANDX_TSO500_CTDNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
}

# Draft status
DRAFT_STATUS = "DRAFT"


def library_to_base_library(library: Library) -> LibraryBase:
    return {
        "orcabusId": library['orcabusId'],
        "libraryId": library['libraryId'],
    }


def add_workflow_draft_event(
        libraries: List[Library],
        workflow_name: str,
        workflow_version: str,
):
    portal_run_id = create_portal_run_id()

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
        ))
    }


def add_pieriandx_tso500_ctdna_draft_event(
        libraries: List[Library],
):
    """
    Add the pieriandx tso500 ctdna draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['PIERIANDX_TSO500_CTDNA'],
        workflow_version=WORKFLOW_VERSION_LIST['PIERIANDX_TSO500_CTDNA'],
        libraries=libraries
    )


def generate_ctdna_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
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
            generate_ctdna_draft_lists([library_iter])
        )


    return {
        "eventDetailList": events_list
    }
