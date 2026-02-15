// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

pub fn main() {
    let args: Vec<String> = std::env::args().collect();
    let exit_code = node_lib::sub_lib::main_tools::main_with_args(args.as_slice());
    ::std::process::exit(exit_code);
}
