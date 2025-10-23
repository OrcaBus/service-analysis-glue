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
    get_all_libraries
)
from orcabus_api_tools.metadata.models import Library, LibraryBase
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id, list_workflows
)

# Globals
WORKFLOW_NAME_LIST = {
    "ONCOANALYSER_WGTS_DNA_RNA": "oncoanalyser-wgts-dna-rna",
    "RNASUM": "rnasum"
}

WORKFLOW_VERSION_LIST = {
    "ONCOANALYSER_WGTS_DNA_RNA": get_ssm_value(environ['ONCOANALYSER_WGTS_DNA_RNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
    "RNASUM": get_ssm_value(environ['RNASUM_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
}

# Draft status
DRAFT_STATUS = "DRAFT"

# EVENT TYPE
EVENT_BUS_NAME = "OrcaBusMain"
EVENT_DETAIL_TYPE = "WorkflowRunStateChange"
EVENT_SOURCE = "orcabus.analysisglue"


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


def add_oncoanalyser_wgts_dna_rna_draft_event(
        libraries: List[Library],
):
    """
    Add the oncoanalyser wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['ONCOANALYSER_WGTS_DNA_RNA'],
        workflow_version=WORKFLOW_VERSION_LIST['ONCOANALYSER_WGTS_DNA_RNA'],
        libraries=libraries
    )


def add_rnasum_draft_event(
        libraries: List[Library],
):
    """
    Add the rnasum draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['RNASUM'],
        workflow_version=WORKFLOW_VERSION_LIST['RNASUM'],
        libraries=libraries
    )


def generate_wgts_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
    return [
        add_oncoanalyser_wgts_dna_rna_draft_event(libraries),
        add_rnasum_draft_event(libraries),
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

    # Filter to just WGS and WTS libraries
    libraries_list = list(filter(
        lambda library_iter_: library_iter_['type'] in ['WGS', 'WTS'],
        libraries_list
    ))

    # If there are no libraries, return an empty list
    if len(libraries_list) == 0:
        return {
            "eventDetailList": events_list
        }

    # Get the subject orcabus id
    subject_orcabus_id = libraries_list[0]['subject']['orcabusId']

    # Split by phenotype
    tumor_dna_libraries = list(filter(
        lambda library_iter_: (
            library_iter_['phenotype'] == 'tumor' and
            library_iter_['type'] == 'WGS'
        ),
        libraries_list
    ))
    normal_dna_libraries = list(filter(
        lambda library_iter_: (
            library_iter_['phenotype'] == 'normal' and
            library_iter_['type'] == 'WGS'
        ),
        libraries_list
    ))
    tumor_rna_libraries = list(filter(
        lambda library_iter_: (
            library_iter_['phenotype'] == 'tumor' and
            library_iter_['type'] == 'WTS'
        ),
        libraries_list
    ))

    # We want to remove these from consideration
    for normal_library_iter in normal_dna_libraries:
        if normal_library_iter['workflow'] == 'BatchControl':
            normal_dna_libraries.remove(normal_library_iter)

    # If there are no tumor libraries and no normal libraries for this
    # subject on this run, return an empty list
    if len(tumor_dna_libraries) == 0 and len(normal_dna_libraries) == 0:
        return {
            "eventDetailList": events_list
        }

    # Check if there are not any tumor WTS libraries for this subject
    if len(tumor_rna_libraries) == 0:
        # If there are no tumor WGS libraries for this subject on this run
        return {
            "eventDetailList": events_list
        }


    # We have at least one dna tumor, one dna normal library or one rna tumor library for this subject on this run
    # We now need to check against all runs to see if there are other libraries for this subject
    # that are not on this run

    # Get all subject libraries
    # We sort by orcabusId descending so that the latest library is first
    # This assumes that orcabusIds are assigned in increasing order over time
    all_subject_libraries = list(filter(
        lambda library_iter_: library_iter_['subject']['orcabusId'] == subject_orcabus_id,
        sorted(
            get_all_libraries(),
            key=lambda library_iter__: library_iter__['orcabusId'],
            reverse=True
        )
    ))

    # Confirm theres at least one one normal WGS and one tumor WGS and one tumor WTS for the subject
    # Across all runs
    if (
            (
                    len(list(filter(
                        lambda library_iter_: (
                                library_iter_['phenotype'] == 'tumor' and
                                library_iter_['type'] == 'WGS'
                        ),
                        all_subject_libraries
                    ))) == 0
            ) or (
                    len(list(filter(
                        lambda library_iter_: (
                                library_iter_['phenotype'] == 'normal' and
                                library_iter_['type'] == 'WGS'
                        ),
                        all_subject_libraries
                    ))) == 0
            ) or (
                    len(list(filter(
                        lambda library_iter_: (
                                library_iter_['phenotype'] == 'tumor' and
                                library_iter_['type'] == 'WTS'
                        ),
                        all_subject_libraries
                    ))) == 0
            )
    ):
        return {
            "eventDetailList": events_list
        }


    # Let's go through the simple use cases first
    # No WGS libraries on this run
    if len(tumor_dna_libraries) == 0 and len(normal_dna_libraries) == 0:
        # We want an analysis for each WTS library on this run
        for tumor_rna_library_iter in tumor_rna_libraries:
            # Grab the latest tumor WGS library
            try:
                tumor_dna_library = next(filter(
                    lambda library_iter_: (
                        library_iter_['phenotype'] == 'tumor' and
                        library_iter_['type'] == 'WGS' and
                        # We only want to consider tumor libraries that match the workflow of the rna library
                        (
                            library_iter_['workflow'] == tumor_rna_library_iter['workflow']
                            if tumor_rna_library_iter['workflow'] == 'clinical' else True
                        )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No WGS tumor library for this subject and workflow
                continue

            # Grab the latest normal WGS library
            try:
                normal_dna_library = next(filter(
                    lambda library_iter_: (
                        library_iter_['phenotype'] == 'normal' and
                        library_iter_['type'] == 'WGS' and
                        # For normal libraries that are clinical, we
                        # only want to consider tumor libraries that are clinical
                        (
                            # For normal libraries
                            library_iter_['workflow'] == tumor_dna_library['workflow']
                            if tumor_dna_library['workflow'] == 'clinical' else True
                        )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No WGS normal library for this subject and workflow
                continue

            # Get library list
            library_list = [tumor_dna_library, normal_dna_library, tumor_rna_library_iter]

            # Add the wgs dna draft event
            events_list.extend(
                generate_wgts_draft_lists(library_list)
            )

        return {
            "eventDetailList": events_list
        }

    # No WTS libraries on this run
    if len(tumor_rna_libraries) == 0:
        # The code below is identical to the wgs analysis logic
        # No normal WGS libraries, just tumors on this run
        if len(normal_dna_libraries) == 0:
            # Collect the appropriate normal library
            # Note that we also want to pair a clinical tumor with a clinical normal
            # So we need to check the workflow of the tumor libraries on this run
            # If any of the tumor libraries on this run are clinical
            # Then we only want to consider clinical normal libraries
            # We create a WGS analysis event for each tumor library
            for tumor_dna_library_iter in tumor_dna_libraries:
                try:
                    normal_dna_library = next(filter(
                        lambda library_iter_: (
                            library_iter_['phenotype'] == 'normal' and
                            library_iter_['type'] == 'WGS' and
                            (
                                # For normal libraries that are clinical, we
                                # only want to consider tumor libraries that are clinical
                                library_iter_['workflow'] == tumor_dna_library_iter['workflow']
                                if tumor_dna_library_iter['workflow'] == 'clinical' else True
                            )
                        ),
                        all_subject_libraries
                    ))
                except StopIteration:
                    # No normal library found for this workflow type, skip it
                    continue

                # Now get the latest wts library for this subject
                try:
                    tumor_rna_library = next(filter(
                        lambda library_iter_: (
                            library_iter_['phenotype'] == 'tumor' and
                            library_iter_['type'] == 'WTS' and
                            (
                                # We only want to consider rna libraries that match the workflow of the tumor dna library
                                # If the tumor dna library is clinical, we only want clinical rna libraries
                                library_iter_['workflow'] == tumor_dna_library_iter['workflow']
                                if tumor_dna_library_iter['workflow'] == 'clinical' else True
                            )
                        ),
                        all_subject_libraries
                    ))
                except StopIteration:
                    # No tumor rna library for this workflow type, skip it
                    continue

                # Get library list
                library_list = [tumor_dna_library_iter, normal_dna_library, tumor_rna_library]

                # Add the wgs dna draft event
                events_list.extend(
                    generate_wgts_draft_lists(library_list)
                )

            return {
                "eventDetailList": events_list
            }

        # No tumor libraries, just normals on this run
        if len(tumor_dna_libraries) == 0:
            # Check if there are multiple normals
            # If so, we cannot proceed
            if len(normal_dna_libraries) > 1:
                return {
                    "eventDetailList": events_list
                }

            # Now we have exactly one normal library on this run
            normal_dna_library = normal_dna_libraries[0]

            # Grab the latest tumor library
            try:
                tumor_dna_library = next(filter(
                    lambda library_iter_: (
                        library_iter_['phenotype'] == 'tumor' and
                        library_iter_['type'] == 'WGS' and
                        # For normal libraries that are clinical, we
                        # only want to consider tumor libraries that are clinical
                        (
                            # For normal libraries
                            library_iter_['workflow'] == normal_dna_libraries[0]['workflow']
                            if normal_dna_libraries[0]['workflow'] == 'clinical' else True
                        )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No tumor library for this subject / workflow
                return {
                    "eventDetailList": events_list
                }

            # Now iterate through all wts libraries for this subject
            try:
                tumor_rna_library = next(filter(
                    lambda library_iter_: (
                            library_iter_['phenotype'] == 'tumor' and
                            library_iter_['type'] == 'WTS' and (
                            # We only want to consider rna libraries that match the workflow of the tumor dna library
                            # If the tumor dna library is clinical, we only want clinical rna libraries
                            library_iter_['workflow'] == tumor_dna_library['workflow']
                            if tumor_dna_library['workflow'] == 'clinical' else True
                        )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No tumor rna library for this workflow type, skip it
                return {
                    "eventDetailList": events_list
                }

            # Get library list
            library_list = [tumor_dna_library, normal_dna_library, tumor_rna_library]

            # Add the wgs dna draft event
            events_list.extend(
                generate_wgts_draft_lists(library_list)
            )

            return {
                "eventDetailList": events_list
            }

        # If we reach here, we have at least one dna tumor and one dna normal on this run
        # We can create a WGS analysis event for each tumor library
        # We will use the latest normal library on this run
        # Check if there are multiple normals
        # If so, we cannot proceed
        if len(normal_dna_libraries) > 1:
            return {
                "eventDetailList": events_list
            }

        # Now we have exactly one normal library on this run
        # Iterate through each tumor library on the run
        # And pair with the normal library on the run
        for tumor_dna_library_iter in tumor_dna_libraries:
            # Grab the latest normal WGS library
            try:
                normal_dna_library = next(filter(
                    lambda library_iter_: (
                            library_iter_['phenotype'] == 'normal' and
                            library_iter_['type'] == 'WGS' and
                            # For normal libraries that are clinical, we
                            # only want to consider tumor libraries that are clinical
                            (
                                # For normal libraries
                                library_iter_['workflow'] == tumor_dna_library_iter['workflow']
                                if tumor_dna_library_iter['workflow'] == 'clinical' else True
                            )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No WGS normal library for this subject and workflow
                continue

            # Now iterate through all wts libraries for this subject
            try:
                tumor_rna_library = next(filter(
                    lambda library_iter_: (
                            library_iter_['phenotype'] == 'tumor' and
                            library_iter_['type'] == 'WTS' and (
                                # We only want to consider rna libraries that match the workflow of the tumor dna library
                                # If the tumor dna library is clinical, we only want clinical rna libraries
                                library_iter_['workflow'] == tumor_dna_library_iter['workflow']
                                if tumor_dna_library_iter['workflow'] == 'clinical' else True
                            )
                    ),
                    all_subject_libraries
                ))
            except StopIteration:
                # No tumor rna library for this workflow type, skip it
                return {
                    "eventDetailList": events_list
                }

            # Get library list
            library_list = [tumor_dna_library_iter, normal_dna_library, tumor_rna_library]
            # Add the wgs dna draft event
            events_list.extend(
                generate_wgts_draft_lists(library_list)
            )

        return {
            "eventDetailList": events_list
        }

    # If we reach here, we have both WTS and WGS libraries on this run
    # First confirm we have just one normal WGS library
    if len(normal_dna_libraries) > 1:
        return {
            "eventDetailList": events_list
        }

    # Now iterate over the tumor wgs libraries
    for tumor_dna_library_iter in tumor_dna_libraries:
        # Get the normal dna library
        normal_dna_library = normal_dna_libraries[0]

        # Get the tumor rna libraries
        for tumor_rna_library_iter in tumor_rna_libraries:
            # Confirm that the workflows match if either is clinical
            if (
                    (tumor_dna_library_iter['workflow'] == 'clinical' or tumor_rna_library_iter['workflow'] == 'clinical') and
                    (tumor_dna_library_iter['workflow'] != tumor_rna_library_iter['workflow'])
            ):
                continue

            # Get library list
            library_list = [tumor_dna_library_iter, normal_dna_library, tumor_rna_library_iter]
            # Add the wgs dna draft event
            events_list.extend(
                generate_wgts_draft_lists(library_list)
            )

    return {
        "eventDetailList": events_list
    }
