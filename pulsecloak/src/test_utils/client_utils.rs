// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

use pulsecloak_lib::messages::NODE_UI_PROTOCOL;
use pulsecloak_lib::utils::localhost;
use std::net::TcpStream;
use websocket::sync::Client;
use websocket::ClientBuilder;

pub fn make_client(port: u16) -> Client<TcpStream> {
    let builder =
        ClientBuilder::new(format!("ws://{}:{}", localhost(), port).as_str()).expect("Bad URL");
    builder
        .add_protocol(NODE_UI_PROTOCOL)
        .connect_insecure()
        .unwrap()
}
