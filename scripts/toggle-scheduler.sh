#!/usr/bin/env bash

# Toggle the weekly preflight-checks EventBridge Scheduler schedule on or off.
#
# Usage:
#   scripts/toggle-scheduler.sh on
#   scripts/toggle-scheduler.sh off
#
# The state machine disables this schedule automatically on its first run each
# week, so this script is the intended way to re-enable it (or to disable it
# manually if needed).
#
# Requirements:
#   - aws CLI v2, configured for the OrcaBus PROD account/region
#   - jq
#
# EventBridge Scheduler's update-schedule replaces the whole definition, so we
# fetch the current schedule, patch only the State field, and submit it back.

set -euo pipefail

SCHEDULE_NAME="orca-analysis-glue-run-preflight-checks-schedule"
SCHEDULE_GROUP="default"

usage() {
  echo "Usage: $(basename "$0") <on|off>" >&2
  echo >&2
  echo "  on   Enable the '${SCHEDULE_NAME}' schedule" >&2
  echo "  off  Disable the '${SCHEDULE_NAME}' schedule" >&2
}

# --- Validate arguments -------------------------------------------------------
if [[ $# -ne 1 ]]; then
  echo "Error: expected exactly one argument, got $#." >&2
  usage
  exit 2
fi

case "$1" in
  on)
    DESIRED_STATE="ENABLED"
    ;;
  off)
    DESIRED_STATE="DISABLED"
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    echo "Error: invalid argument '$1' (expected 'on' or 'off')." >&2
    usage
    exit 2
    ;;
esac

# --- Check tooling ------------------------------------------------------------
for tool in aws jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: required command '$tool' not found on PATH." >&2
    exit 1
  fi
done

# --- Fetch current definition -------------------------------------------------
echo "Fetching current definition of '${SCHEDULE_NAME}'..." >&2
current="$(aws scheduler get-schedule \
  --name "${SCHEDULE_NAME}" \
  --group-name "${SCHEDULE_GROUP}")"

existing_state="$(echo "${current}" | jq -r '.State')"

if [[ "${existing_state}" == "${DESIRED_STATE}" ]]; then
  echo "Schedule '${SCHEDULE_NAME}' is already ${DESIRED_STATE}; nothing to do." >&2
  exit 0
fi

# --- Rebuild the update payload from the current definition -------------------
# update-schedule requires the full definition. We carry over every mutable
# field from get-schedule and override only State. Fields that are null on the
# current schedule are dropped so we do not send nulls back.
update_args="$(echo "${current}" | jq \
  --arg state "${DESIRED_STATE}" \
  '{
     Name,
     GroupName,
     ScheduleExpression,
     ScheduleExpressionTimezone,
     FlexibleTimeWindow,
     Target,
     State: $state,
     Description,
     StartDate,
     EndDate,
     KmsKeyArn,
     ActionAfterCompletion
   }
   | with_entries(select(.value != null))')"

echo "Setting '${SCHEDULE_NAME}' from ${existing_state} to ${DESIRED_STATE}..." >&2
aws scheduler update-schedule --cli-input-json "${update_args}" >/dev/null

echo "Done. Schedule '${SCHEDULE_NAME}' is now ${DESIRED_STATE}." >&2
