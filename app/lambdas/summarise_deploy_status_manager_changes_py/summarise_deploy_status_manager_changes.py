#!/usr/bin/env python3

"""
Deploy status manager changes

"""

# Standard imports
from typing import List, Tuple, Optional
from datetime import datetime

# From layers
from orcabus_api_tools.workflow import (
    get_workflow_run_from_portal_run_id,
    add_comment_to_workflow_run
)
from orcabus_api_tools.deploy_status.models import StackEventResponseDict
from orcabus_api_tools.deploy_status import get_all_stacks_summary

# Get workflow env vars as values
COMMENT_AUTHOR = f"analysis-glue--validation-service"


def handler(event, context):
    """

    :param event:
    :param context:
    :return:
    """

    # Inputs
    deleted: Optional[List[StackEventResponseDict]] = event["deleted"]
    modified: Optional[List[Tuple[StackEventResponseDict, StackEventResponseDict]]] = event["modified"]
    added: Optional[List[StackEventResponseDict]] = event["added"]
    prev_timestamp: datetime = event["prevTimestamp"]
    current_timestamp: datetime = event["currentTimestamp"]
    portal_run_id: str = event["portalRunId"]

    # Get the workflow run from the portal run id
    workflow_run = get_workflow_run_from_portal_run_id(portal_run_id)

    # deleted / modified / added may be None type, convert all to lists
    if deleted is None:
        deleted = []
    if modified is None:
        modified = []
    if added is None:
        added = []

    if all([len(deleted) == 0, len(modified) == 0, len(added) == 0]):
        return

    # Get all current stack statuses
    current_stack_statuses = get_all_stacks_summary()

    # Create a comment stating timestamps
    add_comment_to_workflow_run(
        workflow_run_orcabus_id=workflow_run['orcabusId'],
        comment=(
            f"Deploy status survey was previously performed on {prev_timestamp} "
            f"and we have recently rerun it at {current_timestamp}"
        ),
        author=COMMENT_AUTHOR,
    )

    # Deleted stack change
    if len(deleted) == 0:
        pass
    elif len(deleted) == 1:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run['orcabusId'],
            comment=(
                f"DEL: {deleted[0]['stackName']} was deleted on {deleted[0]['modificationTimestamp']}"
            ),
            author=COMMENT_AUTHOR,
        )
    else:
        for count, deleted_stack in enumerate(deleted, start=1):
            add_comment_to_workflow_run(
                workflow_run_orcabus_id=workflow_run['orcabusId'],
                comment=(
                    f"DEL ({count}/{len(deleted)}): {deleted_stack['stackName']} was deleted on {deleted_stack['modificationTimestamp']}"
                ),
                author=COMMENT_AUTHOR,
            )

    # Modification stack change
    if len(modified) == 0:
        pass
    elif len(modified) == 1:
        modified_old = modified[0][0]
        modified_new = modified[0][1]
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run['orcabusId'],
            comment=(
                f"MOD: {modified_new['stackName']} was changed on {modified_new['modificationTimestamp']}"
            ),
            author=COMMENT_AUTHOR,
        )
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run['orcabusId'],
            comment=(
                f"MOD: {modified_old['stackName']} previous deployment timestamp was {modified_old['modificationTimestamp']}"
            ),
            author=COMMENT_AUTHOR,
        )
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run['orcabusId'],
            comment=(
                f"MOD: {modified_new['stackName']} has changed git commit ids "
                f"from {modified_old['gitCommitId']}, "
                f"to {modified_new['gitCommitId']}"
            ),
            author=COMMENT_AUTHOR,
        )
    else:
        for count, modified_stack_tuple in enumerate(modified, start=1):
            modified_old = modified_stack_tuple[0]
            modified_new = modified_stack_tuple[1]
            add_comment_to_workflow_run(
                workflow_run_orcabus_id=workflow_run['orcabusId'],
                comment=(
                    f"MOD ({count}/{len(modified)}): {modified_new['stackName']} was changed on {modified_new['modificationTimestamp']}"
                ),
                author=COMMENT_AUTHOR,
            )
            add_comment_to_workflow_run(
                workflow_run_orcabus_id=workflow_run['orcabusId'],
                comment=(
                    f"MOD ({count}/{len(modified)}): {modified_old['stackName']} previous deployment timestamp was {modified_old['modificationTimestamp']}"
                ),
                author=COMMENT_AUTHOR,
            )
            add_comment_to_workflow_run(
                workflow_run_orcabus_id=workflow_run['orcabusId'],
                comment=(
                    f"MOD ({count}/{len(modified)}): {modified_new['stackName']} has changed git commit ids "
                    f"from {modified_old['gitCommitId']}, "
                    f"to {modified_new['gitCommitId']}"
                ),
                author=COMMENT_AUTHOR,
            )

    # Added stack change
    if len(added) == 0:
        pass
    elif len(added) == 1:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run['orcabusId'],
            comment=(
                f"ADD: {added[0]['stackName']} was added on {added[0]['modificationTimestamp']}"
            ),
            author=COMMENT_AUTHOR,
        )
    else:
        for count, added_stack in enumerate(added, start=1):
            add_comment_to_workflow_run(
                workflow_run_orcabus_id=workflow_run['orcabusId'],
                comment=(
                    f"ADD ({count}/{len(added)}): {added_stack['stackName']} was added on {added_stack['modificationTimestamp']}"
                ),
                author=COMMENT_AUTHOR,
            )
