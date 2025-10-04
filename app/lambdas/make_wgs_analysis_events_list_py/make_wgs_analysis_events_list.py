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
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id,
    list_workflows
)

# Globals
WORKFLOW_NAME_LIST = {
    "DRAGEN_WGTS_DNA": "dragen-wgts-dna",
    "ONCOANALYSER_WGTS_DNA": "oncoanalyser-wgts-dna",
    "SASH": "sash"
}

WORKFLOW_VERSION_LIST = {
    "DRAGEN_WGTS_DNA": get_ssm_value(environ['DRAGEN_WGTS_DNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
    "ONCOANALYSER_WGTS_DNA": get_ssm_value(environ['ONCOANALYSER_WGTS_DNA_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
    "SASH": get_ssm_value(environ['SASH_WORKFLOW_VERSION_SSM_PARAMETER_NAME']),
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


def add_dragen_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the dragen wgts dna draft event
    :param libraries:
    :return:
    """

    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['DRAGEN_WGTS_DNA'],
        workflow_version=WORKFLOW_VERSION_LIST['DRAGEN_WGTS_DNA'],
        libraries=libraries
    )


def add_oncoanalyser_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the oncoanalyser wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['ONCOANALYSER_WGTS_DNA'],
        workflow_version=WORKFLOW_VERSION_LIST['ONCOANALYSER_WGTS_DNA'],
        libraries=libraries
    )


def add_sash_wgts_dna_draft_event(
        libraries: List[Library],
):
    """
    Add the sash wgts dna draft event
    :param libraries:
    :return:
    """
    return add_workflow_draft_event(
        workflow_name=WORKFLOW_NAME_LIST['SASH'],
        workflow_version=WORKFLOW_VERSION_LIST['SASH'],
        libraries=libraries
    )


def generate_wgs_draft_lists(
        libraries: List[Library],
) -> List[Dict[str, Any]]:
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
            events_list.extend(
                add_dragen_wgts_dna_draft_event(
                    libraries=[ntc_library]
                )
            )

    # If there are no tumor libraries and no normal libraries for this
    # subject on this run, return an empty list
    if len(tumor_libraries) == 0 and len(normal_libraries) == 0:
        return {
            "eventDetailList": events_list
        }

    for normal_library_iter in normal_libraries:
        if normal_library_iter['workflow'] == 'BatchControl':
            # Batch control libraries should only go through dragen
            add_dragen_wgts_dna_draft_event(
                libraries=[normal_library_iter],
            )
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
        lambda library_iter_: library_iter_['subject']['orcabusId'] == subject_orcabus_id,
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


if __name__ == "__main__":
    import json
    print(
        json.dumps(
            handler(
                {
                    "libraryIdList": [
                        "L2401542",
                        "L2401543"
                    ]
                },
                None
            ),
            indent=4
    ))
