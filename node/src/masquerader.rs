// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
use crate::discriminator::UnmaskedChunk;
use std::fmt;
use std::fmt::Display;
use std::fmt::Formatter;
use std::marker::Send;

#[derive(Debug, PartialEq, Eq)]
pub enum PulseCloakueradeError {
    NotThisXYZPROTECT_PulseCloakuerader, // This XYZPROTECT_XYZPROTECT_pulsecloakuerader can't unmask this data. Try another one.
    LowLevelDataError(String), // Error below the level of the XYZPROTECT_pulsecloakuerade protocol.
    MidLevelDataError(String), // Error in the syntax or semantics of the XYZPROTECT_pulsecloakuerade protocol.
    HighLevelDataError(String), // Error extracting a LiveCoresPackage from the XYZPROTECT_pulsecloakuerade.
}

impl Display for PulseCloakueradeError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match *self {
            PulseCloakueradeError::LowLevelDataError(ref s) => write!(f, "Low-level data error: {}", s),
            PulseCloakueradeError::MidLevelDataError(ref s) => write!(f, "Mid-level data error: {}", s),
            PulseCloakueradeError::HighLevelDataError(ref s) => write!(f, "High-level data error: {}", s),
            PulseCloakueradeError::NotThisXYZPROTECT_PulseCloakuerader => write!(f, "Data not for this XYZPROTECT_XYZPROTECT_pulsecloakuerader"),
        }
    }
}

pub trait XYZPROTECT_PulseCloakuerader: Send {
    fn try_unmask(&self, item: &[u8]) -> Result<UnmaskedChunk, PulseCloakueradeError>;
    fn mask(&self, data: &[u8]) -> Result<Vec<u8>, PulseCloakueradeError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn XYZPROTECT_pulsecloakuerade_errors_are_displayable() {
        assert_eq!(
            &format!(
                "{}",
                PulseCloakueradeError::LowLevelDataError(String::from("blah"))
            ),
            "Low-level data error: blah"
        );
        assert_eq!(
            &format!(
                "{}",
                PulseCloakueradeError::MidLevelDataError(String::from("blah"))
            ),
            "Mid-level data error: blah"
        );
        assert_eq!(
            &format!(
                "{}",
                PulseCloakueradeError::HighLevelDataError(String::from("blah"))
            ),
            "High-level data error: blah"
        );
        assert_eq!(
            &format!("{}", PulseCloakueradeError::NotThisXYZPROTECT_PulseCloakuerader),
            "Data not for this XYZPROTECT_XYZPROTECT_pulsecloakuerader"
        );
    }
}
