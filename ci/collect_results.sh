#!/bin/bash -xev
# Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
CI_DIR="$( cd "$( dirname "$0" )" && pwd )"
function sudo_ask() {
  case "$OSTYPE" in
    msys)
      "$@"
      ;;
    Darwin | darwin* | linux*)
      sudo "$@"
      ;;
  esac
}

function copy_binaries() {
  case "$OSTYPE" in
    msys)
      copy_windows_binaries
      ;;
    Darwin | darwin* | linux*)
      copy_non_windows_binaries
      ;;
  esac
}

function copy_windows_binaries() {
  mkdir generated/bin
  cp ../dns_utility/target/release/dns_utility.exe generated/bin || echo "No console dns_utility binary"
  cp ../dns_utility/target/release/dns_utilityw.exe generated/bin || echo "No non-console dns_utility binary"
  cp ../node/target/release/PulseCloakNode.exe generated/bin || echo "No console PulseCloakNode binary"
  cp ../node/target/release/PulseCloakNodeW.exe generated/bin || echo "No non-console PulseCloakNode binary"
  cp ../node/target/release/pulsecloak.exe generated/bin || echo "No pulsecloak binary"
  cp ../automap/target/release/automap.exe generated/bin || echo "No automap binary"
}

function copy_non_windows_binaries() {
  mkdir generated/bin
  cp ../dns_utility/target/release/dns_utility generated/bin || echo "No dns_utility binary"
  cp ../node/target/release/PulseCloakNode generated/bin || echo "No PulseCloakNode binary"
  cp ../node/target/release/pulsecloak generated/bin || echo "No pulsecloak binary"
  cp ../automap/target/release/automap generated/bin || echo "No automap binary"
}

mkdir -p "$CI_DIR/../results"
pushd "$CI_DIR/../results"
sudo_ask rm -rf generated
mkdir generated
sudo_ask cp -R ../node/generated generated/node || echo "No results from PulseCloak Node"
cp -R ../dns_utility/generated generated/dns_utility || echo "No results from dns_utility"
cp -R ../multinode_integration_tests/generated generated/multinode_integration_tests || echo "No results from multinode integration tests"
copy_binaries
sudo_ask tar -czvf generated.tar.gz generated/*
popd
