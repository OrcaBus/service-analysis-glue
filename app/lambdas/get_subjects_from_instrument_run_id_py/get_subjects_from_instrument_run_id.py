#!/usr/bin/env python3

"""
Given an insturment run id, list the instrument run ids given a sample type

Inputs:
  * sampleType
  * instrumentRunId

"""

# Layer imports
from orcabus_api_tools.metadata import get_libraries_list_from_library_id_list
from orcabus_api_tools.sequence import get_library_id_list_from_instrument_run_id


def handler(event, context):
    # Get inputs
    instrument_run_id = event['instrumentRunId']
    sequence_run_id = event['sequenceRunId']
    sample_type_list = event['sampleTypeList']

    # Get libraries
    libraries = list(filter(
        lambda library_iter_: library_iter_['type'] in sample_type_list,
        get_libraries_list_from_library_id_list(
            list(set(get_library_id_list_from_instrument_run_id(
                instrument_run_id=instrument_run_id,
                sequence_run_id=sequence_run_id,
            )))
        )
    ))

    # Return library ids
    return {
        "subjectIdList": sorted(list(set(list(map(
            lambda library_iter_: library_iter_['subject']['subjectId'],
            libraries
        )))))
    }
