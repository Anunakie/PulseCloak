#!/bin/bash -xev
# Copyright (c) 2024, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
CI_DIR="$( cd "$( dirname "$0" )" && pwd )"

pushd "$CI_DIR/.."
ci/lint.sh
ci/unit_tests.sh
popd
