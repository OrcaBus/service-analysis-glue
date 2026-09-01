#!/usr/bin/env python3

"""
Get the live cloudformation stacks and upload to S3.

This lambda:
1. Finds the most recent existing all-stacks summary in S3 (if any).
2. Writes the current all-stacks summary to S3.
3. Returns the S3 URIs of the previous and current summaries under the keys
   "oldSummary" and "newSummary".

The comparison / diff between these two summaries is performed downstream by the
summarise_deploy_status_manager_changes lambda.
"""

# Imports
from os import environ
from urllib.parse import urlparse
import boto3
import typing
from datetime import datetime, UTC
from pathlib import Path
import json
from typing import Optional, List, TypedDict

# Layer imports
from orcabus_api_tools.deploy_status.models import StackEventResponseDict
from orcabus_api_tools.deploy_status import get_all_stacks_summary
from orcabus_api_tools.utils.aws_helpers import get_ssm_value

# Globals
S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME_ENV_VAR = "S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME"

# Type check imports
if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client
    from mypy_boto3_s3.type_defs import ObjectTypeDef


# Models
class ResponseDict(TypedDict):
    oldSummary: Optional[str]
    newSummary: str


# Functions
def get_s3_client() -> 'S3Client':
    return boto3.client('s3')


def find_most_recent_deployment_status_uri(bucket: str, prefix: str) -> Optional[str]:
    """
    Given a bucket and prefix, find the most recent all_stacks_summary file in the path and
    return its s3 uri.
    :param bucket:
    :param prefix:
    :return: the s3 uri of the most recent summary, or None if none exists
    """
    s3_client = get_s3_client()
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
    if 'Contents' not in response:
        return None

    try:
        latest_response_obj: 'ObjectTypeDef' = next(filter(
            lambda object_iter_: (
                object_iter_['Key'].endswith('.json') and
                Path(object_iter_['Key']).name.startswith('all_stacks_summary_')
            ),
            sorted(
                response['Contents'],
                key=lambda object_iter_: object_iter_['Key'],
                reverse=True
            )
        ))
    except StopIteration:
        return None

    return str("s3://" + str(Path(bucket) / latest_response_obj['Key']))


def dump_current_state_to_s3(
        current_timestamp: datetime,
        all_stacks_summary: List[StackEventResponseDict],
        s3_uri: str
) -> str:
    """
    Write the current all stacks summary to s3 and return the full s3 uri it was written to.
    """
    # Get s3 path
    s3_deployment_status_dump_path_url_obj = urlparse(s3_uri)
    # urlparse leaves a leading '/' on the path (e.g. '/deployment-snapshots/').
    # S3 object keys must not start with '/', otherwise the key won't match the
    # IAM resource pattern (deployment-snapshots/*) and PutObject is denied.
    s3_key_prefix = s3_deployment_status_dump_path_url_obj.path.lstrip('/')
    s3_key = str(
        Path(s3_key_prefix) /
        f'year={str(current_timestamp.year).zfill(4)}' /
        f'month={str(current_timestamp.month).zfill(2)}' /
        f'day={str(current_timestamp.day).zfill(2)}' /
        f'all_stacks_summary_{int(current_timestamp.timestamp())}.json'
    )
    get_s3_client().put_object(
        Bucket=s3_deployment_status_dump_path_url_obj.netloc,
        Key=s3_key,
        Body=json.dumps(
            all_stacks_summary,
            separators=(',', ':'),
        )
    )

    return str("s3://" + str(Path(s3_deployment_status_dump_path_url_obj.netloc) / s3_key))


def handler(event, context) -> ResponseDict:
    """
    Get the live cloudformation stack summary JSON, dump it to S3 and return the s3 uris of the
    previous (old) and current (new) summaries.
    :param event:
    :param context:
    :return:
    """

    # Get all stacks summary
    all_stacks_summary = get_all_stacks_summary()

    # Get current datetime object
    now = datetime.now(UTC)

    # Get the s3 prefix to write to / read from
    s3_uri_prefix = get_ssm_value(environ[S3_DEPLOYMENT_STATUS_DUMP_PATH_PREFIX_SSM_PARAMETER_NAME_ENV_VAR])
    s3_uri_prefix_obj = urlparse(s3_uri_prefix)

    # Find most recent s3 file in path (before we write the new one).
    # Strip the leading '/' from the parsed path so the list prefix matches the
    # object keys we write (which must not start with '/').
    old_summary_uri = find_most_recent_deployment_status_uri(
        bucket=s3_uri_prefix_obj.netloc,
        prefix=s3_uri_prefix_obj.path.lstrip('/')
    )

    # Dump current state to s3
    new_summary_uri = dump_current_state_to_s3(
        current_timestamp=now,
        all_stacks_summary=all_stacks_summary,
        s3_uri=s3_uri_prefix
    )

    return {
        "oldSummary": old_summary_uri,
        "newSummary": new_summary_uri,
    }
