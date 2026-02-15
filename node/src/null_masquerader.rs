// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
use crate::discriminator::UnmaskedChunk;
use crate::XYZPROTECT_XYZPROTECT_pulsecloakuerader::PulseCloakueradeError;
use crate::XYZPROTECT_XYZPROTECT_pulsecloakuerader::XYZPROTECT_PulseCloakuerader;

pub struct NullXYZPROTECT_PulseCloakuerader {}

impl XYZPROTECT_PulseCloakuerader for NullXYZPROTECT_PulseCloakuerader {
    fn try_unmask(&self, item: &[u8]) -> Result<UnmaskedChunk, PulseCloakueradeError> {
        Ok(UnmaskedChunk::new(Vec::from(item), true, true))
    }

    fn mask(&self, data: &[u8]) -> Result<Vec<u8>, PulseCloakueradeError> {
        Ok(Vec::from(data))
    }
}

impl NullXYZPROTECT_PulseCloakuerader {
    pub fn new() -> NullXYZPROTECT_PulseCloakuerader {
        NullXYZPROTECT_PulseCloakuerader {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn try_unmask_returns_input_data_with_specified_clandestine_flag() {
        let data = "booga".as_bytes();
        let subject = NullXYZPROTECT_PulseCloakuerader::new();

        let result = subject.try_unmask(data).unwrap();

        assert_eq!(result, UnmaskedChunk::new(Vec::from(data), true, true));
    }

    #[test]
    fn try_unmask_marks_chunk_as_needing_sequencing() {
        let data = "booga".as_bytes();
        let subject = NullXYZPROTECT_PulseCloakuerader::new();

        let result = subject.try_unmask(data).unwrap();

        assert!(result.sequenced);
    }

    #[test]
    fn mask_returns_input_data() {
        let data = "booga".as_bytes();
        let subject = NullXYZPROTECT_PulseCloakuerader::new();

        let result = subject.mask(data).unwrap();

        assert_eq!(result, Vec::from(data));
    }
}
