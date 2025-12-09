#!/usr/bin/env python3

"""
Make a list of events from a list of libraries

If there are multiple tumors, we create a WGS analysis list for each tumor, finding the latest normal

If there is just one normal, we find the latest tumor for that subject.

We do not expect the case for there to be multiple tumors and multiple normals for a subject on a given run
"""
# Standard imports
import json
from copy import copy
from os import environ
from typing import List, Dict, Any, Literal
import logging

# Layer imports
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
    get_all_libraries
)
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from analysis_tool_kit import add_workflow_draft_event_detail, Workflow, get_existing_workflow_runs

# Type hints
WorkflowName = Literal['DRAGEN_WGTS_DNA', 'ONCOANALYSER_WGTS_DNA', 'SASH']


# Globals
WORKFLOW_OBJECTS_DICT: Dict[WorkflowName, Workflow] = {
    "DRAGEN_WGTS_DNA": json.loads(get_ssm_value(environ['DRAGEN_WGTS_DNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
    "ONCOANALYSER_WGTS_DNA": json.loads(get_ssm_value(environ['ONCOANALYSER_WGTS_DNA_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
    "SASH": json.loads(get_ssm_value(environ['SASH_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

# Draft status
DRAFT_STATUS = "DRAFT"

# Germline only workflow names
GERMLINE_ONLY_WORKFLOW_NAMES = [
    'control',
    'germline',
]

# Set logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_dragen_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the dragen wgts dna draft event
    :param libraries:
    :return:
    """
    # Check for existing runs
    existing_workflow_runs = get_existing_workflow_runs(
        workflow_name=WORKFLOW_OBJECTS_DICT['DRAGEN_WGTS_DNA']['name'],
        workflow_version=WORKFLOW_OBJECTS_DICT['DRAGEN_WGTS_DNA']['version'],
        libraries=libraries
    )

    if len(existing_workflow_runs) > 0:
        logger.warning(
            "Existing DRAGEN WGTS DNA workflow runs found for library: %s" % libraries[0]['libraryId']
        )
        return None

    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['DRAGEN_WGTS_DNA']
    )


def add_oncoanalyser_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the oncoanalyser wgts dna draft event
    :param libraries:
    :return:
    """
    # Check for existing runs
    existing_workflow_runs = get_existing_workflow_runs(
        workflow_name=WORKFLOW_OBJECTS_DICT['ONCOANALYSER_WGTS_DNA']['name'],
        workflow_version=WORKFLOW_OBJECTS_DICT['ONCOANALYSER_WGTS_DNA']['version'],
        libraries=libraries
    )

    if len(existing_workflow_runs) > 0:
        logger.warning(
            "Existing ONCOANALYSER WGTS DNA workflow runs found for library: %s" % libraries[0]['libraryId']
        )
        return None

    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['ONCOANALYSER_WGTS_DNA']
    )


def add_sash_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the sash wgts dna draft event
    :param libraries:
    :return:
    """
    # Check for existing runs
    existing_workflow_runs = get_existing_workflow_runs(
        workflow_name=WORKFLOW_OBJECTS_DICT['SASH']['name'],
        workflow_version=WORKFLOW_OBJECTS_DICT['SASH']['version'],
        libraries=libraries
    )

    if len(existing_workflow_runs) > 0:
        logger.warning(
            "Existing SASH workflow runs found for library: %s" % libraries[0]['libraryId']
        )
        return None

    return add_workflow_draft_event_detail(
        libraries=libraries,
        **WORKFLOW_OBJECTS_DICT['SASH']
    )


def generate_wgs_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
    """
    Generate the WGS draft lists
    :param libraries:
    :return:
    """
    return [
        add_dragen_wgts_dna_draft_event(libraries),
        add_oncoanalyser_wgts_dna_draft_event(libraries),
        add_sash_wgts_dna_draft_event(libraries),
    ]


def handler(event, context):
    """
    Get the library id list
    :param event:
    :param context:
    :return:
    """
    # Initialise the events list
    events_list = []

    # Get the library id list
    library_id_list = event.get("libraryIdList", [])

    # Get the libraries as library objects
    libraries_list: List[Library] = get_libraries_list_from_library_id_list(
        library_id_list
    )

    # Filter to WGS libraries only
    libraries_list = list(filter(
        lambda library_iter_: library_iter_['type'] == 'WGS',
        libraries_list
    ))

    if len(libraries_list) == 0:
        return {
            "eventDetailList": events_list
        }

    # Get the subject orcabus id
    subject_orcabus_id = libraries_list[0]['subject']['orcabusId']

    # Split by phenotype
    tumor_libraries = list(filter(
        lambda library_iter_: library_iter_['phenotype'] == 'tumor',
        libraries_list
    ))
    normal_libraries = list(filter(
        lambda library_iter_: library_iter_['phenotype'] == 'normal',
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
                add_dragen_wgts_dna_draft_event(
                    libraries=[ntc_library]
                )
            ])

    # If there are no tumor libraries and no normal libraries for this
    # subject on this run, return an empty list
    if len(tumor_libraries) == 0 and len(normal_libraries) == 0:
        return {
            "eventDetailList": events_list
        }

    # Check for batch control libraries
    # Or germline specific projects
    for normal_library_iter in copy(normal_libraries):
        if (
                # Is this the batch control library
                normal_library_iter['workflow'] in GERMLINE_ONLY_WORKFLOW_NAMES
        ):
            # Batch control libraries should only go through dragen component
            # Likewise, gen airspace libraries should only go through dragen component
            events_list.extend([
                add_dragen_wgts_dna_draft_event(
                    libraries=[normal_library_iter],
                )
            ])
            # Remove from normal libraries list
            normal_libraries.remove(normal_library_iter)

    # Recheck if there are no tumor libraries and no normal libraries for this
    # subject on this run, return an empty list
    if len(tumor_libraries) == 0 and len(normal_libraries) == 0:
        return {
            "eventDetailList": events_list
        }

    # We have at least one tumor or one normal library for this subject on this run
    # We now need to check against all runs to see if there are other libraries for this subject
    # that are not on this run

    # Get all subject libraries
    # We sort by orcabusId descending so that the latest library is first
    # This assumes that orcabusIds are assigned in increasing order over time
    all_subject_libraries = list(filter(
        lambda library_iter_: (
            library_iter_['subject']['orcabusId'] == subject_orcabus_id and
            library_iter_['type'] == 'WGS'
        ),
        sorted(
            get_all_libraries(),
            key=lambda library_iter__: library_iter__['orcabusId'],
            reverse=True
        )
    ))

    # Confirm theres at least one one normal and one tumor library for the subject
    # Across all runs
    if (
            (
                    len(list(filter(
                        lambda library_iter_: library_iter_['phenotype'] == 'tumor',
                        all_subject_libraries
                    ))) == 0
            ) or (
            len(list(filter(
                lambda library_iter_: library_iter_['phenotype'] == 'normal',
                all_subject_libraries
            ))) == 0
    )
    ):
        return {
            "eventDetailList": events_list
        }

    # Let's go through the simple use cases first
    # No normal libraries, just tumors on this run
    if len(normal_libraries) == 0:
        # Collect the appropriate normal library
        # Note that we also want to pair a clinical tumor with a clinical normal
        # So we need to check the workflow of the tumor libraries on this run
        # If any of the tumor libraries on this run are clinical
        # Then we only want to consider clinical normal libraries
        # We create a WGS analysis event for each tumor library
        for tumor_library_iter in tumor_libraries:
            try:
                normal_library = next(filter(
                    lambda library_iter_: (
                            library_iter_['phenotype'] == 'normal' and
                            (
                                # For normal libraries that are clinical, we
                                # only want to consider tumor libraries that are clinical
                                library_iter_['workflow'] == tumor_library_iter['workflow']
                                if tumor_library_iter['workflow'] == 'clinical' else True
                            )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                continue
            # Get library list
            library_list = [tumor_library_iter, normal_library]
            # Add the wgs dna draft event
            events_list.extend(
                generate_wgs_draft_lists(library_list)
            )

        return {
            "eventDetailList": events_list
        }

    # No tumor libraries, just normals on this run
    if len(tumor_libraries) == 0:
        # Check if there are multiple normals
        # If so, we cannot proceed
        if len(normal_libraries) > 1:
            return {
                "eventDetailList": []
            }

        # Grab the latest tumor library
        try:
            tumor_library = next(filter(
                lambda library_iter_: (
                        library_iter_['phenotype'] == 'tumor' and
                        # For normal libraries that are clinical, we
                        # only want to consider tumor libraries that are clinical
                        (
                            # For normal libraries
                            library_iter_['workflow'] == normal_libraries[0]['workflow']
                            if normal_libraries[0]['workflow'] == 'clinical' else True
                        )
                ),
                all_subject_libraries
            ))
        except StopIteration:
            return {
                "eventDetailList": []
            }

        # Get the normal library
        normal_library = normal_libraries[0]

        # Get library list
        library_list = [tumor_library, normal_library]

        # Add the wgs dna draft event
        events_list.extend(
            generate_wgs_draft_lists(library_list)
        )

        return {
            "eventDetailList": events_list
        }

    # If we reach here, we have at least one tumor and one normal on this run
    # We can create a WGS analysis event for each tumor library
    # We will use the latest normal library on this run
    # Check if there are multiple normals
    # If so, we cannot proceed
    if len(normal_libraries) > 1:
        return {
            "eventDetailList": []
        }

    # Now we have exactly one normal library on this run
    # Iterate through each tumor library on the run
    # And pair with the normal library on the run
    for tumor_library_iter in tumor_libraries:
        normal_library = normal_libraries[0]
        # Get library list
        library_list = [tumor_library_iter, normal_library]
        # Add the wgs dna draft event
        events_list.extend(
            generate_wgs_draft_lists(library_list)
        )

    return {
        "eventDetailList": events_list
    }
