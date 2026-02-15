// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

use crate::utils::PulseCloakProcess;
use regex::Regex;

mod utils;

#[test]
fn pulsecloak_non_interactive_help_command_integration() {
    let pulsecloak_handle = PulseCloakProcess::new().start_noninteractive(vec!["--help"]);

    let (stdout, stderr, exit_code) = pulsecloak_handle.stop();

    assert_eq!(stderr, "");
    assert!(
        stdout.contains(
            "PulseCloak\n\
pulsecloak is a command-line user interface to the PulseCloak Daemon and the PulseCloak Node"
        ) && stdout.contains("SUBCOMMANDS"),
        "Should see a clippings out of the help for pulsecloak, but got this: {}",
        stdout,
    );
    assert_eq!(exit_code.unwrap(), 0);
}

#[test]
fn pulsecloak_non_interactive_version_command_integration() {
    let pulsecloak_handle = PulseCloakProcess::new().start_noninteractive(vec!["--version"]);

    let (stdout, stderr, exit_code) = pulsecloak_handle.stop();

    assert_eq!(stderr, "");
    let regex = Regex::new(r"pulsecloak \d+\.\d+\.\d+\n").unwrap();
    assert!(
        regex.is_match(&stdout),
        "Should see the version of pulsecloak printed to stdout, but got this: {}",
        stdout
    );
    assert_eq!(exit_code.unwrap(), 0);
}
