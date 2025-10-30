#!/usr/bin/env python3

"""
Make a list of events from a list of libraries

If there are multiple tumors, we create a WGS analysis list for each tumor, finding the latest normal

If there is just one normal, we find the latest tumor for that subject.

We do not expect the case for there to be multiple tumors and multiple normals for a subject on a given run
"""
# Standard imports
from os import environ
from typing import List, Dict, Any, cast

from typing_extensions import TypedDict

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
from orcabus_api_tools.fastq import get_fastqs_in_library

# Globals
WORKFLOW_NAME_LIST = {
    "DRAGEN_TSO500_CTDNA": 'dragen-tso500-ctdna',
}

WORKFLOW_VERSION_LIST = {
    "DRAGEN_TSO500_CTDNA": get_ssm_value(environ['DRAGEN_TSO500_CTDNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
}

DRAFT_STATUS = "DRAFT"


class ReadSet(TypedDict):
    orcabusId: str
    rgid: str


class EventLibrary(LibraryBase):
    readsets: List[ReadSet]


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
        workflow_name: str,
        workflow_version: str,
):
    # Set the portal run id
    portal_run_id = create_portal_run_id()

    # Workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id
    )

    workflow = next(filter(
        lambda workflow_iter_: workflow_iter_.get("name") == workflow_name,
        list_workflows(
            workflow_name=workflow_name,
            workflow_version=workflow_version
        )
    ))

    return {
        "status": DRAFT_STATUS,
        "workflow": workflow,
        "workflowRunName": workflow_run_name,
        "portalRunId": portal_run_id,
        "libraries": list(map(
            library_to_event_library,
            libraries
        ))
    }


def add_dragen_tso500_ctdna_draft_event(
        libraries: List[Library],
):
    """
    Add the dragen tso500 ctdna draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event_detail(
        workflow_name=WORKFLOW_NAME_LIST['DRAGEN_TSO500_CTDNA'],
        workflow_version=WORKFLOW_VERSION_LIST['DRAGEN_TSO500_CTDNA'],
        libraries=libraries
    )


def generate_ctdna_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
    return [
        add_dragen_tso500_ctdna_draft_event(libraries),
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
        # Add the tso500 ctdna draft event
        events_list.extend(
            generate_ctdna_draft_lists([library_iter])
        )


    return {
        "eventDetailList": events_list
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
