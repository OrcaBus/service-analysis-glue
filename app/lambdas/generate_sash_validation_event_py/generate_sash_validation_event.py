#!/usr/bin/env python3

"""
Read in the SSM parameter that defines the basic input configuration for all validation libraries


"""

# Standard imports
import json
from os import environ
from typing import List, Dict, Literal, TypedDict
import logging

# Layer imports
from orcabus_api_tools.metadata import (
    get_libraries_list_from_library_id_list,
)
from orcabus_api_tools.metadata.models import Library
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from analysis_tool_kit.models import Payload
from analysis_tool_kit import (
    # Functions
    add_workflow_draft_event_detail,
    # Models
    Workflow,
)

# Type hints
WorkflowsList = Literal['SASH']


class WorkflowDraftType(TypedDict):
    libraryIdList: List[str]
    payload: Payload


# Globals
WORKFLOW_VALIDATION_PREFIX = 'umccr--validation'
WORKFLOW_OBJECTS_DICT: Dict[WorkflowsList, Workflow] = {
    "SASH": json.loads(get_ssm_value(environ['SASH_WORKFLOW_OBJECT_SSM_PARAMETER_NAME'])),
}

# Set logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def handler(event, context):
    """
    Get the library id list
    :param event:
    :param context:
    :return:
    """
    # Get the workflow configuration lists
    sample_configuration: WorkflowDraftType = event.get("sampleConfiguration")

    # Get the libraries as library objects
    libraries_list: List[Library] = get_libraries_list_from_library_id_list(
        sample_configuration['libraryIdList']
    )

    return {
        "eventDetail": add_workflow_draft_event_detail(
            libraries=libraries_list,
            payload=sample_configuration['payload'],
            workflow_run_prefix=WORKFLOW_VALIDATION_PREFIX,
            **WORKFLOW_OBJECTS_DICT['SASH'],
        )
    }
