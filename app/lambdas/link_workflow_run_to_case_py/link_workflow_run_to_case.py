#!/usr/bin/env python3

"""
Link workflow run to case

Given a portal run id and a case orcabus id perform the following actions:

1. Get the workflow run orcabus ID from the portal run id
2. Update the case with the workflow run id

"""

# Standard Imports


# Layer imports
from orcabus_api_tools.workflow import (
    get_workflow_run_from_portal_run_id
)
from orcabus_api_tools.case import (
    link_entity_to_case
)

# Globals
WORKFLOW_RUN_ENTITY_TYPE = "workflow_run"


def handler(event, context):
    """
    Link a workflow run to a case
    :param event:
    :param context:
    :return:
    """
    # Get inputs
    portal_run_id = event['portalRunId']
    case_orcabus_id = event['caseOrcabusId']

    # Get workflow run orcabus id from the portal run id
    workflow_run_orcabus_id = get_workflow_run_from_portal_run_id(portal_run_id)['orcabusId']

    # Link the workflow run orcabus id to the case
    link_entity_to_case(
        # Case vars
        orcabus_id=case_orcabus_id,
        # External entity vars
        entity_type=WORKFLOW_RUN_ENTITY_TYPE,
        entity_id=workflow_run_orcabus_id,
    )
