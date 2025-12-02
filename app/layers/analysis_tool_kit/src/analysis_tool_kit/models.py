#!/usr/bin/env python3

# Standard Imports
from typing import List, TypedDict, NotRequired

# Layer imports
from orcabus_api_tools.metadata.models import LibraryBase


class Workflow(TypedDict):
    name: str
    version: str
    codeVersion: NotRequired[str]
    executionEngine: NotRequired[str]
    executionEnginePipelineId: NotRequired[str]
    validationState: NotRequired[str]


class ReadSet(TypedDict):
    orcabusId: str
    rgid: str


class EventLibrary(LibraryBase):
    readsets: List[ReadSet]
