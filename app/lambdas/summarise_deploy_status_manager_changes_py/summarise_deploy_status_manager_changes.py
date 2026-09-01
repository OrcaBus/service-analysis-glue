#!/usr/bin/env python3

"""
Summarise deploy status manager changes.

Given the s3 uris of the previous (old) and current (new) all-stacks summaries, read both
summaries, compute the difference between them (restricted to the stacks we observe) and post
comments describing the changes onto the validation workflow run.

Comment formatting:
- Deleted stacks: list the stack names as dot points.
- Added stacks: for each stack, list the name, modification timestamp and git commit id
  (if provided).
- Modified stacks: for each stack, list the old modification timestamp and git commit id,
  then the new modification timestamp and git commit id.
"""

# Standard imports
from os import environ
from urllib.parse import urlparse
import json
import typing
from typing import List, Optional, Tuple

# Third party / boto3
import boto3

# From layers
from orcabus_api_tools.workflow import (
    get_workflow_run_from_portal_run_id,
    add_comment_to_workflow_run,
)
from orcabus_api_tools.deploy_status.models import StackEventResponseDict
from orcabus_api_tools.utils.aws_helpers import get_ssm_value

# Type check imports
if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

# Globals
GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME_ENV_VAR = "GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME"
DELETE_COMPLETE_STATUS = "DELETE_COMPLETE"

# Get workflow env vars as values
COMMENT_AUTHOR = "analysis-glue--validation-service"


# Functions
def get_s3_client() -> 'S3Client':
    return boto3.client('s3')


def read_summary_from_s3(s3_uri: str) -> List[StackEventResponseDict]:
    """
    Read an all-stacks summary json from s3 and return it as a list of stack event dicts.
    """
    s3_uri_obj = urlparse(s3_uri)
    return json.loads(
        get_s3_client().get_object(
            Bucket=s3_uri_obj.netloc,
            Key=s3_uri_obj.path.lstrip('/')
        )['Body'].read()
    )


def get_stack_by_name(
    stacks: List[StackEventResponseDict],
    stack_name: str
) -> Optional[StackEventResponseDict]:
    """
    Return the stack matching the given name, or None if not present.
    """
    return next(
        filter(
            lambda stack_iter_: stack_iter_['stackName'] == stack_name,
            stacks
        ),
        None
    )


def stack_exists(stack: Optional[StackEventResponseDict]) -> bool:
    """
    A stack 'exists' if it is present and not in a DELETE_COMPLETE state.
    """
    if stack is None:
        return False
    return stack.get('status') != DELETE_COMPLETE_STATUS


def compare_deployment_status_manager_state(
    status_manager_state_old: List[StackEventResponseDict],
    status_manager_state_new: List[StackEventResponseDict],
    stacks_to_observe_list: List[str],
) -> Tuple[
    List[StackEventResponseDict],
    List[Tuple[StackEventResponseDict, StackEventResponseDict]],
    List[StackEventResponseDict],
]:
    """
    For each observed stack, determine whether it has been:
    - deleted (existed before, no longer exists),
    - added (did not exist before, now exists),
    - modified (exists in both, but the git commit id has changed).

    :return: (stacks_deleted, stacks_modified, stacks_added)
        stacks_deleted: list of old stack dicts
        stacks_modified: list of (old stack dict, new stack dict) tuples
        stacks_added: list of new stack dicts
    """
    stacks_deleted: List[StackEventResponseDict] = []
    stacks_modified: List[Tuple[StackEventResponseDict, StackEventResponseDict]] = []
    stacks_added: List[StackEventResponseDict] = []

    for stack_name in stacks_to_observe_list:
        old_stack = get_stack_by_name(status_manager_state_old, stack_name)
        new_stack = get_stack_by_name(status_manager_state_new, stack_name)

        old_exists = stack_exists(old_stack)
        new_exists = stack_exists(new_stack)

        # Added - did not exist before, now exists
        if not old_exists and new_exists:
            stacks_added.append(new_stack)
        # Deleted - existed before, no longer exists
        elif old_exists and not new_exists:
            stacks_deleted.append(old_stack)
        # Modified - exists in both, git commit id changed
        elif old_exists and new_exists:
            if old_stack.get('gitCommitId') != new_stack.get('gitCommitId'):
                stacks_modified.append((old_stack, new_stack))

    return stacks_deleted, stacks_modified, stacks_added


def build_deleted_comment(stacks_deleted: List[StackEventResponseDict]) -> str:
    """
    List the deleted stack names as dot points.
    """
    lines = ["The following stacks were deleted:"]
    for stack in stacks_deleted:
        lines.append(f"- {stack['stackName']}")
    return "\n".join(lines)


def build_added_comment(stacks_added: List[StackEventResponseDict]) -> str:
    """
    For each added stack list the name, modification timestamp and git commit id (if provided).
    """
    lines = ["The following stacks were added:"]
    for stack in stacks_added:
        stack_line = (
            f"- {stack['stackName']} "
            f"(deployed at {stack.get('modificationTimestamp')}"
        )
        git_commit_id = stack.get('gitCommitId')
        if git_commit_id:
            stack_line += f", git commit id {git_commit_id}"
        stack_line += ")"
        lines.append(stack_line)
    return "\n".join(lines)


def build_modified_comment(
    stacks_modified: List[Tuple[StackEventResponseDict, StackEventResponseDict]]
) -> str:
    """
    For each modified stack list the old modification timestamp and git commit id, then the new
    modification timestamp and git commit id.
    """
    lines = ["The following stacks were modified:"]
    for old_stack, new_stack in stacks_modified:
        lines.append(f"- {new_stack['stackName']}")
        lines.append(
            f"    - Previous: deployed at {old_stack.get('modificationTimestamp')}, "
            f"git commit id {old_stack.get('gitCommitId')}"
        )
        lines.append(
            f"    - Current: deployed at {new_stack.get('modificationTimestamp')}, "
            f"git commit id {new_stack.get('gitCommitId')}"
        )
    return "\n".join(lines)


def handler(event, context):
    """
    :param event: contains oldSummary (Optional[str] s3 uri), newSummary (str s3 uri) and
        portalRunId (str)
    :param context:
    :return:
    """

    # Inputs
    old_summary_uri: Optional[str] = event.get("oldSummary")
    new_summary_uri: str = event["newSummary"]
    portal_run_id: str = event["portalRunId"]

    # Get the workflow run from the portal run id
    workflow_run = get_workflow_run_from_portal_run_id(portal_run_id)
    workflow_run_orcabus_id = workflow_run['orcabusId']

    # If there is no previous summary, there is nothing to compare against
    if old_summary_uri is None:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id,
            comment=(
                "No previous deployment snapshot was found, so no deployment changes could be "
                "computed for this validation run."
            ),
            author=COMMENT_AUTHOR,
        )
        return

    # Read both summaries from s3
    status_manager_state_old = read_summary_from_s3(old_summary_uri)
    status_manager_state_new = read_summary_from_s3(new_summary_uri)

    # Get the list of stacks to observe
    stacks_to_observe_list: List[str] = json.loads(
        get_ssm_value(environ[GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME_ENV_VAR])
    )

    # Compute the diff
    stacks_deleted, stacks_modified, stacks_added = compare_deployment_status_manager_state(
        status_manager_state_old=status_manager_state_old,
        status_manager_state_new=status_manager_state_new,
        stacks_to_observe_list=stacks_to_observe_list,
    )

    # If nothing has changed, comment as such and return
    if not any([stacks_deleted, stacks_modified, stacks_added]):
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id,
            comment="No deployment changes were detected across the observed stacks.",
            author=COMMENT_AUTHOR,
        )
        return

    # Deleted stacks
    if stacks_deleted:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id,
            comment=build_deleted_comment(stacks_deleted),
            author=COMMENT_AUTHOR,
        )

    # Added stacks
    if stacks_added:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id,
            comment=build_added_comment(stacks_added),
            author=COMMENT_AUTHOR,
        )

    # Modified stacks
    if stacks_modified:
        add_comment_to_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id,
            comment=build_modified_comment(stacks_modified),
            author=COMMENT_AUTHOR,
        )
