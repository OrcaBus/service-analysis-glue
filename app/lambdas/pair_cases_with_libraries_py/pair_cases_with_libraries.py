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
from typing import List, TypedDict, NotRequired, Literal, Dict, cast
import re

# Layer imports
from orcabus_api_tools.case import list_cases
from orcabus_api_tools.case.models import Case

# Globals and types
RNASUM_REFERENCE_COLUMN_PREFIX = "rnasumReference"
RnasumDatasetType = Literal[
  'Acc',
  'Gbm',
  'Lgg',
  'Ucs',
  'Uvm',
  'Blca',
  'Brca',
  'Cesc',
  'Chol',
  'Coad',
  'Dlbc',
  'Esca',
  'Hnsc',
  'Kich',
  'Kirc',
  'Kirp',
  'Laml',
  'Lihc',
  'Luad',
  'Lusc',
  'Meso',
  'Paad',
  'Pcpg',
  'Prad',
  'Read',
  'Sarc',
  'Skcm',
  'Stad',
  'Tgct',
  'Thca',
  'Thym',
  'Ucec',
  'Pancan',
  'BlcaNet',
  'PaadAcc',
  'PaadNet',
  'PaadIpmn',
  'LuadLcnec',
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


def get_rnasum_reference_list_from_redcap_payload(redcap_payload: Dict[str, str]) -> List[RnasumDatasetType]:
    rnasum_data_set_type_list = []
    for redcap_key, redcap_value in redcap_payload.items():
        if (
                redcap_key.startswith(RNASUM_REFERENCE_COLUMN_PREFIX) and
                redcap_value.isnumeric() and
                int(redcap_value) == 1
        ):
            dataset_name = re.sub(rf"^{RNASUM_REFERENCE_COLUMN_PREFIX}__", "", redcap_key)
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
            "caseOrcabusId": case_obj['caseOrcabusId'],
            "rnasumDatasetList": get_rnasum_reference_list_from_redcap_payload(case_obj.get('redcapPayload', {}))
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
    all_cases: List[Case] = list_cases()

    # Get cases for this library list
    filtered_case_list = filter_cases_by_library_list(all_cases, library_id_list)

    # Get case response objects
    case_response_object_list: List[CaseResponseObject] = get_all_case_response_objects(filtered_case_list)

    # Find libraries in library_id_list that are not in any of the case response object list
    library_id_list_not_in_case_response_object_list: List[str] = list(filter(
        lambda library_id_iter_: not any(
            library_id_iter_ in case_response_object_iter_["libraryIdList"]
            for case_response_object_iter_ in case_response_object_list
        ),
        library_id_list
    ))

    # Append libraries not in any case response object list
    case_response_object_list.append(cast(
        CaseResponseObject,
        cast(object, {
            "libraryIdList": library_id_list_not_in_case_response_object_list
        })
    ))

    return {
        "caseList": case_response_object_list
    }
