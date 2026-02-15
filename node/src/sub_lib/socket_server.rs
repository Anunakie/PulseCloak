// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
use pulsecloak_lib::command::StdStreams;
use pulsecloak_lib::multi_config::MultiConfig;
use pulsecloak_lib::shared_schema::ConfiguratorError;
use tokio::prelude::Future;

pub trait ConfiguredByPrivilege: Future<Item = (), Error = ()> {
    fn initialize_as_privileged(
        &mut self,
        multi_config: &MultiConfig,
    ) -> Result<(), ConfiguratorError>;
    fn initialize_as_unprivileged(
        &mut self,
        multi_config: &MultiConfig,
        streams: &mut StdStreams<'_>,
    ) -> Result<(), ConfiguratorError>;
}
