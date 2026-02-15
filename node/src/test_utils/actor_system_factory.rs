// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

use crate::accountant::db_access_objects::banned_dao::BannedCacheLoader;
use crate::database::rusqlite_wrappers::ConnectionWrapper;
use std::sync::{Arc, Mutex};

#[derive(Default)]
pub struct BannedCacheLoaderMock {
    pub load_params: Arc<Mutex<Vec<Box<dyn ConnectionWrapper>>>>,
}

impl BannedCacheLoader for BannedCacheLoaderMock {
    fn load(&self, conn: Box<dyn ConnectionWrapper>) {
        self.load_params.lock().unwrap().push(conn);
    }
}
