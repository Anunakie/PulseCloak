// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

use crate::utils::{DaemonProcess, PulseCloakProcess};
use pulsecloak_lib::utils::find_free_port;
use std::thread;
use std::time::Duration;

mod utils;

#[test]
fn ensure_data_directory_has_specific_chain_directory_within_integration() {
    let port = find_free_port();
    let daemon_handle = DaemonProcess::new().start(port.clone());
    let pulsecloak_handle = PulseCloakProcess::new().start_noninteractive(vec![
        "--ui-port",
        *&port.to_string().to_owned().as_str(),
        "setup",
    ]);
    let (stdout, _stderr, _exit_code) = pulsecloak_handle.stop();
    let mut pulsecloak_handle2 = PulseCloakProcess::new().start_interactive(port, true);
    let mut stdin_handle = pulsecloak_handle2.create_stdin_handle();

    stdin_handle.type_command("setup --data-directory /home/booga/pulsecloakhome/base-mainnet");

    thread::sleep(Duration::from_millis(1000));

    stdin_handle.type_command("exit");

    let (stdout2, _stderr2, _exit_code2) = pulsecloak_handle2.stop();
    let expected = format!(
        "{:29} {:64} {}",
        "data-directory", "/home/booga/pulsecloakhome/base-mainnet", "Set"
    );

    assert!(
        !stdout.contains("PulseCloak/base-mainnet/PulseCloak/base-mainnet Default"),
        "Wrong directory: duplication of /PulseCloak/base-mainnet when Default"
    );
    assert!(
        stdout2.contains(&expected),
        "Wrong directory: missing chain specific directory when Set:\nstdout: {}\n",
        stdout2
    );

    daemon_handle.kill();
}
