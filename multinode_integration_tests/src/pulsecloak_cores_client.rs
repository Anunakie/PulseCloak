// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
use crate::pulsecloak_node_client::PulseCloakNodeClient;
use crate::pulsecloak_real_node::STANDARD_CLIENT_TIMEOUT_MILLIS;
use node_lib::hopper::live_cores_package::LiveCoresPackage;
use node_lib::masquerader::Masquerader;
use node_lib::sub_lib::cryptde::CryptDE;
use node_lib::sub_lib::cryptde::PlainData;
use node_lib::sub_lib::cryptde::PublicKey;
use node_lib::sub_lib::hopper::IncipientCoresPackage;
use std::net::SocketAddr;

pub struct PulseCloakCoresClient<'a> {
    cryptde: &'a dyn CryptDE,
    delegate: PulseCloakNodeClient,
}

impl<'a> PulseCloakCoresClient<'a> {
    pub fn new(socket_addr: SocketAddr, cryptde: &'a dyn CryptDE) -> PulseCloakCoresClient<'a> {
        PulseCloakCoresClient {
            cryptde,
            delegate: PulseCloakNodeClient::new(socket_addr, STANDARD_CLIENT_TIMEOUT_MILLIS),
        }
    }

    pub fn transmit_package(
        &mut self,
        incipient_cores_package: IncipientCoresPackage,
        masquerader: &dyn Masquerader,
        recipient_key: PublicKey,
    ) {
        let (live_cores_package, _) =
            LiveCoresPackage::from_incipient(incipient_cores_package, self.cryptde).unwrap();
        let serialized_lcp = serde_cbor::ser::to_vec(&live_cores_package)
            .unwrap_or_else(|_| panic!("Serializing LCP: {:?}", live_cores_package));
        let encoded_serialized_package = self
            .cryptde
            .encode(&recipient_key, &PlainData::new(&serialized_lcp[..]))
            .unwrap();
        let masqueraded = masquerader
            .mask(encoded_serialized_package.as_slice())
            .unwrap_or_else(|_| {
                panic!("PulseCloakuerading {}-byte serialized LCP", serialized_lcp.len())
            });
        self.delegate.send_chunk(&masqueraded);
    }

    pub fn masquerade_live_cores_package(
        live_cores_package: LiveCoresPackage,
        masquerader: &dyn Masquerader,
    ) -> Vec<u8> {
        let serialized_lcp = serde_cbor::ser::to_vec(&live_cores_package)
            .unwrap_or_else(|_| panic!("Serializing LCP: {:?}", live_cores_package));
        masquerader
            .mask(&serialized_lcp[..])
            .unwrap_or_else(|_| panic!("PulseCloakuerading {}-byte serialized LCP", serialized_lcp.len()))
    }
}
