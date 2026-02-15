#!/bin/bash -xev
# Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
CI_DIR="$( cd "$( dirname "$0" )" && pwd )"

pushd "$CI_DIR/.."
if [[ "$1" == "clear" ]]; then
  sudo chmod -R 777 target
fi
cargo build --all --lib --bins --release --verbose --features "pulsecloak_lib/no_test_share automap/no_test_share"
if [[ "$1" == "clear" ]]; then
  sudo chmod -R 777 target
fi
popd
