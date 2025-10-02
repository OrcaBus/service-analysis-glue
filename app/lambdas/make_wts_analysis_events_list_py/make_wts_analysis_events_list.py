#!/usr/bin/env python3

"""
Make WTS analysis events list
"""

# Standard imports
from typing import List, Dict, Any
from os import environ

# Layer imports
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library, LibraryBase
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id, list_workflows
)

# Globals
WORKFLOW_NAME_LIST = {
    "DRAGEN_WGTS_RNA": "dragen-wgts-rna",
    "ARRIBA_WGTS_RNA": "arriba-wgts-rna",
    "ONCOANALYSER_WGTS_RNA": "oncoanalyser-wgts-rna",
}

WORKFLOW_VERSION_LIST = {
    "DRAGEN_WGTS_RNA": get_ssm_value(environ['DRAGEN_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
    "ARRIBA_WGTS_RNA": get_ssm_value(environ['ARRIBA_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
    "ONCOANALYSER_WGTS_RNA": get_ssm_value(environ['ONCOANALYSER_WGTS_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
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
            lambda library_obj_iter_: {
                "libraryId": library_obj_iter_['libraryId'],
                "orcabusId": library_obj_iter_['orcabusId']
            },
            libraries
        ))
    }


def add_dragen_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the dragen wgts dna draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['DRAGEN_WGTS_RNA'],
        workflow_version=WORKFLOW_VERSION_LIST['DRAGEN_WGTS_RNA'],
        libraries=libraries
    )


def add_arriba_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the sash wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['ARRIBA_WGTS_RNA'],
        workflow_version=WORKFLOW_VERSION_LIST['ARRIBA_WGTS_RNA'],
        libraries=libraries
    )


def add_oncoanalyser_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the oncoanalyser wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['ONCOANALYSER_WGTS_RNA'],
        workflow_version=WORKFLOW_VERSION_LIST['ONCOANALYSER_WGTS_RNA'],
        libraries=libraries
    )


def generate_wts_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
    return [
        add_dragen_wgts_rna_draft_event(libraries),
        add_arriba_wgts_rna_draft_event(libraries),
        add_oncoanalyser_wgts_rna_draft_event(libraries),
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

    # We only need the one phenotype
    tumor_libraries = list(filter(
        lambda library_iter_: library_iter_['phenotype'] == 'tumor',
        libraries_list
    ))

    events_list = []
    for library_iter in tumor_libraries:
        # Add the wgs dna draft event
        events_list.extend(
            generate_wts_draft_lists([library_iter])
        )

    return {
        "eventDetailList": events_list
    }
