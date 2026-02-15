// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

use crate::utils::DaemonProcess;
use crate::utils::PulseCloakProcess;
use pulsecloak_lib::utils::find_free_port;
use regex::Regex;
use std::thread;
use std::time::Duration;

mod utils;

#[test]
fn interactive_mode_allows_a_help_call_integration() {
    let port = find_free_port();
    let daemon_handle = DaemonProcess::new().start(port);
    let mut pulsecloak_handle = PulseCloakProcess::new().start_interactive(port, true);
    let mut stdin_handle = pulsecloak_handle.create_stdin_handle();

    stdin_handle.type_command("help");

    thread::sleep(Duration::from_millis(300));
    stdin_handle.type_command("exit");
    let (stdout, _stderr, _) = pulsecloak_handle.stop();
    daemon_handle.kill();
    //TODO put this assertion back when GH-446 is played out - paired with the test below
    //assert_eq!(stderr, "");
    assert!(
        stdout.contains(
            "PulseCloak
pulsecloak is a command-line user interface to the PulseCloak Daemon and the PulseCloak Node
"
        ),
        "Should see a printed message of the help for pulsecloak, but got this: {}",
        stdout,
    );
    let mut ending_part = stdout.lines().rev().take(2);
    let last_line = ending_part.next().unwrap();
    let line_before_the_last_one = ending_part.next().unwrap();
    let regex = Regex::new(r"\w{5,}?").unwrap();
    assert!(
        regex.is_match(line_before_the_last_one),
        "Should find the very end of the help for \
     pulsecloak in a correct form, but got this: {}",
        stdout,
    );
    assert_eq!(
        last_line, "pulsecloak> ",
        "Should find pulsecloak prompt on the last line but got this: {}",
        stdout,
    )
}

#[test]
fn interactive_mode_allows_a_version_call_integration() {
    let port = find_free_port();
    let daemon_handle = DaemonProcess::new().start(port);
    let mut pulsecloak_handle = PulseCloakProcess::new().start_interactive(port, true);
    let mut stdin_handle = pulsecloak_handle.create_stdin_handle();

    stdin_handle.type_command("version");

    thread::sleep(Duration::from_millis(300));
    stdin_handle.type_command("exit");
    let (stdout, _stderr, _) = pulsecloak_handle.stop();
    daemon_handle.kill();
    //TODO put this assertion back when GH-446 is played out - paired with the test above
    //assert_eq!(stderr, "");
    let regex = Regex::new(r"pulsecloak> \npulsecloak \d+\.\d+\.\d+\npulsecloak> ").unwrap();
    assert!(
        regex.is_match(&stdout),
        "Should see a printed message of the current version of pulsecloak, but got this: {}",
        stdout,
    );
}
