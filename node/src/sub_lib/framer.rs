// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

#[derive(Debug, PartialEq, Eq)]
pub struct FramedChunk {
    pub chunk: Vec<u8>,
    pub last_chunk: bool,
}

pub trait Framer: Send {
    fn add_data(&mut self, data: &[u8]);
    fn take_frame(&mut self) -> Option<FramedChunk>;
}
