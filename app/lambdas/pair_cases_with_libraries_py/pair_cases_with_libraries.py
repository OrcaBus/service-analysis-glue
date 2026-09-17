#!/usr/bin/env python3

"""
Pair Cases with Libraries

For each set of libraries find the following cases and return the following event structure

{
  "caseIdWithLibraryIdList": [
    {
      "caseOrcabusId"?: "cas.1234567890",
      "libraryIdList": [
        "L1234568"
      ]
      "rnasumDatasetList"?: [
        "PANCAN",
        "GBM"...
      ]
    },
    {
      "caseOrcabusId": null // libraries not matched to any cases
      "libraryIdList": [
        "L1234567"
      ]
    }
  ]
}
"""

# Standard imports
from operator import concat
from functools import reduce
from typing import List, TypedDict, NotRequired, Literal, Dict, cast
import re

# Layer imports
from orcabus_api_tools.case import list_cases
from orcabus_api_tools.case.models import Case

# Globals and types
RNASUM_REFERENCE_COLUMN_PREFIX = "rnasumReference"
RnasumDatasetType = Literal[
  # PRIMARY_DATASETS_OPTION \
  "BRCA", "THCA", "HNSC", "LGG", "KIRC", "LUSC", "LUAD", "PRAD", "STAD", "LIHC", "COAD", "KIRP",
  "BLCA", "OV", "SARC", "PCPG", "CESC", "UCEC", "PAAD", "TGCT", "LAML", "ESCA", "GBM", "THYM",
  "SKCM", "READ", "UVM", "ACC", "MESO", "KICH", "UCS", "DLBC", "CHOL",
  # EXTENDED_DATASETS_OPTION
  "LUAD-LCNEC", "BLCA-NET",
  "PAAD-IPMN", "PAAD-NET", "PAAD-ACC",
  # PAN_CANCER_DATASETS_OPTION
  "PANCAN"
]

# Case status
CaseStatusType = Literal[
    "request_received",  # Request Received
    "wgts_tumour_sample_received",  # WGTS Tumour Sample Received
    "wgts_germline_sample_received",  # WGTS Germline Sample Received
    "cttso_sample_received",  # CTTSO Sample Received
    "all_sample_received",  # All Sample Received
    "library_partially_failed",  # Library Partially Failed
    "sequencing_started",  # Sequencing Started
    "sequencing_completed",  # Sequencing Completed
    "bioinformatics_started",  # Bioinformatics Started
    "bioinformatics_completed",  # Bioinformatics Completed
    "curation_started",  # Curation Started
    "curation_completed",  # Curation Completed
    "locked",  # Locked
    "unlocked",  # Unlocked
    "failed",  # Failed
    "completed",  # Completed
    "archived",  # Archived
]


CASE_STATUS_BLOCKED: List[CaseStatusType] = [
    "locked",
    "failed",
    "curation_completed",
    "completed",
    "archived"
]


class CaseResponseObject(TypedDict):
    caseOrcabusId: NotRequired[str]
    libraryIdList: List[str]
    rnasumDatasetList: NotRequired[List[RnasumDatasetType]]


def filter_cases_by_library_list(case_list: List[Case], library_id_list: List[str]) -> List[Case]:
    """
    Return only the cases where a library in the library_id_list is present in the case.
    :param case_list:
    :param library_id_list:
    :return:
    """
    return list(filter(
        lambda case_iter_: any(
            library_id_iter_ in get_all_libraries_in_case(case_iter_)
            for library_id_iter_ in library_id_list
        ),
        case_list
    ))


def get_all_libraries_in_case(case_obj: Case) -> List[str]:
    """
    Under case.externalEntitySet
    Find all libraries where:
    .externalEntity.type = 'library'
    .externalEntity.serviceName = 'metadata'
    Return the .externalEntity.alias attribute
    :param case_obj:
    :return:
    """
    return list(map(
        lambda external_library_entity_iter_: external_library_entity_iter_['externalEntity']['alias'],
        list(filter(
            lambda external_entity_iter_: (
                external_entity_iter_['externalEntity']['type'] == 'library' and
                external_entity_iter_['externalEntity']['serviceName'] == 'metadata'
            ),
            case_obj['externalEntitySet']
        ))
    ))


def get_rnasum_reference_list_from_redcap_payload(
        redcap_payload: Dict[str, str]
) -> List[RnasumDatasetType]:
    rnasum_data_set_type_list = []
    for redcap_key, redcap_value in redcap_payload.items():
        if (
                redcap_key.startswith(RNASUM_REFERENCE_COLUMN_PREFIX) and
                redcap_value.isnumeric() and
                int(redcap_value) == 1
        ):
            # Move to uppercase and expand PAAD prefix to PAAD-
            dataset_name = re.sub(rf"^{RNASUM_REFERENCE_COLUMN_PREFIX}__", "", redcap_key).upper()
            dataset_name = re.sub("^PAAD", "PAAD-", dataset_name)
            rnasum_data_set_type_list.append(cast(RnasumDatasetType, dataset_name))
    return rnasum_data_set_type_list


def get_all_case_response_objects(case_list: List[Case]) -> List[CaseResponseObject]:
    """
    Get all libraries in all cases
    :param case_list:
    :return:
    """
    return list(map(
        lambda case_obj: {
            "libraryIdList": get_all_libraries_in_case(case_obj),
            "caseOrcabusId": case_obj['orcabusId'],
            "rnasumDatasetList": get_rnasum_reference_list_from_redcap_payload(
                case_obj.get('redcapPayload', {})
            )
        },
        case_list
    ))


def handler(event, context) -> Dict[Literal['caseList'], List[CaseResponseObject]]:
    """
    List cases
    :param event:
    :param context:
    :return:
    """
    # Get inputs
    library_id_list = event.get("libraryIdList", [])

    # Get cases
    case_list: List[Case] = cast(List[Case], reduce(
        concat,
        list(map(
            lambda library_id_iter_: list_cases(
                params={
                    "libraryId": library_id_iter_,
                }
            ),
            library_id_list
        ))
    ))

    # Reduce duplicates
    case_list: List[Case] = list({(case['orcabusId']): case for case in case_list}.values())

    # Remove cases where case status is not open
    case_list = list(filter(
        lambda case_iter_: case_iter_["latestState"]['status'] not in CASE_STATUS_BLOCKED,
        case_list
    ))

    # Get case response objects
    case_response_object_list: List[CaseResponseObject] = get_all_case_response_objects(case_list)

    # Find libraries in library_id_list that are not in any of the case response object list
    library_id_list_not_in_case_response_object_list: List[str] = list(filter(
        lambda library_id_iter_: not any(
            library_id_iter_ in case_response_object_iter_["libraryIdList"]
            for case_response_object_iter_ in case_response_object_list
        ),
        library_id_list
    ))

    # Append libraries not in any case response object list
    # But we don't want an object of empty lists
    if len(library_id_list_not_in_case_response_object_list) > 0:
        case_response_object_list.append(cast(
            CaseResponseObject,
            cast(object, {
                "libraryIdList": library_id_list_not_in_case_response_object_list
            })
        ))

    return {
        "caseList": case_response_object_list
    }
