// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.

#![cfg(test)]

use crate::accountant::db_access_objects::payable_dao::PayableAccount;
use pulsecloak_lib::type_obfuscation::Obfuscated;

pub fn protect_payables_in_test(payables: Vec<PayableAccount>) -> Obfuscated {
    Obfuscated::obfuscate_vector(payables)
}
