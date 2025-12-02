#!/usr/bin/env python3

"""
Make WTS analysis events list
"""

# Standard imports
from typing import List, Dict, Any, Literal
from os import environ
import json

# Layer imports
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library
from analysis_tool_kit import Workflow, add_workflow_draft_event_detail

# Typehints
WorkflowName = Literal['DRAGEN_WGTS_RNA', 'ARRIBA_WGTS_RNA', 'ONCOANALYSER_WGTS_RNA']

# Globals
WORKFLOW_OBJECTS_DICT: Dict[WorkflowName, Workflow] = {
    "DRAGEN_WGTS_RNA": json.loads(get_ssm_value(environ['DRAGEN_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
    "ARRIBA_WGTS_RNA": json.loads(get_ssm_value(environ['ARRIBA_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
    "ONCOANALYSER_WGTS_RNA": json.loads(get_ssm_value(environ['ONCOANALYSER_WGTS_RNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

# Draft status
DRAFT_STATUS = "DRAFT"


def add_dragen_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the dragen wgts rna draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['DRAGEN_WGTS_RNA'],
    )


def add_arriba_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the sash wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['ARRIBA_WGTS_RNA'],
    )


def add_oncoanalyser_wgts_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the oncoanalyser wgts rna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['ONCOANALYSER_WGTS_RNA'],
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
    # Initialise events list
    events_list = []

    # Get the library id list
    library_id_list = event.get("libraryIdList", [])

    # Get the libraries as library objects
    libraries_list: List[Library] = get_libraries_list_from_library_id_list(
        library_id_list
    )

    # Filter to WTS libraries only
    libraries_list = list(filter(
        lambda library_iter_: library_iter_['type'] == 'WTS',
        libraries_list
    ))

    # Check for negative control
    negative_control_libraries = list(filter(
        lambda library_iter_: library_iter_['phenotype'].startswith('negative'),
        libraries_list
    ))

    if len(negative_control_libraries) > 0:
        # Negative control libraries should only go through dragen
        for ntc_library in negative_control_libraries:
            events_list.extend([
                add_dragen_wgts_rna_draft_event(
                    libraries=[ntc_library]
                )
            ])

    # We only need the one phenotype
    tumor_libraries = list(filter(
        lambda library_iter_: library_iter_['phenotype'] == 'tumor',
        libraries_list
    ))

    for library_iter in tumor_libraries:
        # Add the wgs rna draft event
        events_list.extend(
            generate_wts_draft_lists([library_iter])
        )

    return {
        "eventDetailList": events_list
    }
