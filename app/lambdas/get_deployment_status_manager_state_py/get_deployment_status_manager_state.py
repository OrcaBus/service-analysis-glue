#!/usr/bin/env python3

"""
Get the live cloudformation stacks and upload to S3
"""

# Imports
from os import environ
from urllib.parse import urlparse
import boto3
import typing
from datetime import datetime, UTC
from pathlib import Path
import json
from typing import Optional, List, cast, Tuple, TypedDict
from fastapi.encoders import jsonable_encoder

# Layer imports
from orcabus_api_tools.deploy_status.models import StackEventResponseDict
from orcabus_api_tools.deploy_status import get_all_stacks_summary
from orcabus_api_tools.utils.aws_helpers import get_ssm_value

# Globals
S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME_ENV_VAR = "S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME"
GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME_ENV_VAR = "GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME"

# Type check imports
if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client
    from mypy_boto3_s3.type_defs import ObjectTypeDef


# Models
class ResponseDict(TypedDict):
    deleted: Optional[List[StackEventResponseDict]]
    modified: Optional[List[Tuple[StackEventResponseDict, StackEventResponseDict]]]
    added: Optional[List[StackEventResponseDict]]
    prev_timestamp: Optional[datetime]
    current_timestamp: Optional[datetime]


# Functions
def get_s3_client() -> 'S3Client':
    return boto3.client('s3')


def find_most_recent_deployment_status(bucket: str, prefix: str) -> Optional[Tuple[datetime, List[StackEventResponseDict]]]:
    """
    Given a bucket and prefix, find the most recent file in the path
    :param bucket:
    :param prefix:
    :return:
    """
    s3_client = get_s3_client()
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
    if 'Contents' not in response:
        return None

    try:
        latest_response_obj: 'ObjectTypeDef' = next(filter(
            lambda object_iter_: (
                object_iter_['Key'].endswith('.json') and
                object_iter_['Key'].startswith('all_stacks_summary_')
            ),
            sorted(
                response['Contents'],
                key=lambda object_iter_: object_iter_['Key'],
                reverse=True
            )
        ))

        return (
            latest_response_obj['LastModified'],
            cast(
                List[StackEventResponseDict],
                json.loads(
                    get_s3_client().get_object(
                        Bucket=bucket,
                        Key=latest_response_obj['Key']
                    )['Body'].read()
                )
            )
        )
    except StopIteration:
        return None

def dump_current_state_to_s3(
        current_timestamp: datetime,
        all_stacks_summary: List[StackEventResponseDict],
        s3_uri: str
):
    # Get s3 path
    s3_deployment_status_dump_path_url_obj = urlparse(s3_uri)
    get_s3_client().put_object(
        Bucket=s3_deployment_status_dump_path_url_obj.netloc,
        Key=str(
            Path(s3_deployment_status_dump_path_url_obj.path) /
            f'year={str(current_timestamp.year).zfill(4)}' /
            f'month={str(current_timestamp.month).zfill(2)}' /
            f'day={str(current_timestamp.day).zfill(2)}' /
            f'all_stacks_summary_{int(current_timestamp.timestamp())}.json'
        ),
        Body=json.dumps(
            all_stacks_summary,
            separators=(',', ':'),
        )
    )


def compare_deployment_status_manager_state(
    status_manager_state_old: List[StackEventResponseDict],
    status_manager_state_new: List[StackEventResponseDict],
    stacks_to_observe_list: List[str],
):
    """
    For each object in the stack we want to show
    - stacks that have changed,
    - stacks that have been deleted
    - stacks that have been added

    :param status_manager_state_old:
    :param status_manager_state_new:
    :return:
    """

    # Initialise response dictionaries
    stacks_deleted = []
    stacks_modified = []
    stacks_added = []

    # Iterate over each stack of interest
    for stack_name in stacks_to_observe_list:
        # Is added?
        if (
            # Stack previously deleted or non-existent
            (
                    not stack_name in list(map(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_old
                    )) or
                    next(filter(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_old
                    ))['status'] in ['DELETE_COMPLETE']
            ) and
            # Stack now exists and not in a deleted state
            (
                    stack_name in list(map(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_new
                    )) and
                    not next(filter(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_new
                    ))['status'] in ['DELETE_COMPLETE']
            )
        ):
            stacks_added.append(next(filter(
                lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                status_manager_state_new
            )))

        # Is deleted?
        elif (
            # Stack previously existed
            (
                    stack_name in list(map(
                    lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                    status_manager_state_old
                    )) and
                    not next(filter(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_old
                    ))['status'] in ['DELETE_COMPLETE']
            ) and
            # Stack now no longer exists
            (
                    not stack_name in list(map(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_new
                    )) or
                    next(filter(
                        lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                        status_manager_state_new
                    ))['status'] in ['DELETE_COMPLETE']
            )
        ):
            stacks_deleted.append(next(filter(
                lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                status_manager_state_old
            )))

        # Is changed?
        elif (
                not (
                        next(filter(
                            lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                            status_manager_state_old
                        ))['gitCommitId']
                ) == (
                        next(filter(
                            lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                            status_manager_state_new
                        ))['gitCommitId']
                )
        ):
            stacks_modified.append([
                next(filter(
                    lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                    status_manager_state_old
                )),
                next(filter(
                    lambda stack_iter_: stack_iter_['StackName'] == stack_name,
                    status_manager_state_new
                ))
            ])

    return stacks_deleted, stacks_modified, stacks_added


def handler(event, context) -> ResponseDict:
    """
    Get the live cloudformation stack git commit ids JSON and dump to S3
    :param event:
    :param context:
    :return:
    """

    # Get all stacks summary
    all_stacks_summary = get_all_stacks_summary()

    # Get current datetime object
    now = datetime.now(UTC)

    # Write out all stacks summary deployment
    s3_uri_prefix = get_ssm_value(environ[S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME_ENV_VAR])
    s3_uri_prefix_obj = urlparse(s3_uri_prefix)

    # Get git stacks to object
    stacks_to_observe_list = json.loads(get_ssm_value(GIT_STACKS_TO_OBSERVE_SSM_PARAMETER_NAME_ENV_VAR))

    # Find most recent s3 file in path
    prev_timestamp, previous_status = find_most_recent_deployment_status(
        bucket=s3_uri_prefix_obj.netloc,
        prefix=s3_uri_prefix_obj.path
    )
    dump_current_state_to_s3(
        current_timestamp=now,
        all_stacks_summary=all_stacks_summary,
        s3_uri=s3_uri_prefix
    )
    if previous_status is None:
        return jsonable_encoder({
            "deleted": None,
            "modified": None,
            "added": stacks_to_observe_list,
            "prevTimestamp": None,
            "currentTimestamp": now,
        })

    stacks_deleted, stacks_modified, stacks_added = compare_deployment_status_manager_state(
        status_manager_state_old=previous_status,
        status_manager_state_new=all_stacks_summary,
        stacks_to_observe_list=stacks_to_observe_list
    )

    return jsonable_encoder({
        "deleted": stacks_deleted,
        "modified": stacks_modified,
        "added": stacks_added,
        "prevTimestamp": prev_timestamp,
        "currentTimestamp": now,
    })
