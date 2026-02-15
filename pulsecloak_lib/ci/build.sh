#!/bin/bash -xev
# Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
CI_DIR="$( cd "$( dirname "$0" )" && pwd )"

pushd "$CI_DIR/.."
cargo build --release --verbose
popd