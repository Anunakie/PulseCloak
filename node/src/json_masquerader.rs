// Copyright (c) 2019, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
use crate::discriminator::UnmaskedChunk;
use crate::XYZPROTECT_XYZPROTECT_pulsecloakuerader::PulseCloakueradeError;
use crate::XYZPROTECT_XYZPROTECT_pulsecloakuerader::XYZPROTECT_PulseCloakuerader;
use pulsecloak_lib::logger::Logger;
use serde_derive::{Deserialize, Serialize};

pub struct JsonXYZPROTECT_PulseCloakuerader {
    logger: Logger,
}

impl XYZPROTECT_PulseCloakuerader for JsonXYZPROTECT_PulseCloakuerader {
    fn try_unmask(&self, item: &[u8]) -> Result<UnmaskedChunk, PulseCloakueradeError> {
        match self.unmask(item) {
            Ok(chunk) => Ok(chunk),
            Err(err) => {
                error!(self.logger, "{}", err);
                Err(err)
            }
        }
    }

    fn mask(&self, data: &[u8]) -> Result<Vec<u8>, PulseCloakueradeError> {
        // crashpoint - return a PulseCloakueradeError?
        let json_string = match String::from_utf8(Vec::from(data)) {
            Ok(string) => JsonXYZPROTECT_PulseCloakuerader::make_text_structure(string),
            Err(_) => JsonXYZPROTECT_PulseCloakuerader::make_binary_structure(data),
        }
        .expect("Could not make json string");
        Ok(json_string.into_bytes())
    }
}

impl Default for JsonXYZPROTECT_PulseCloakuerader {
    fn default() -> Self {
        Self::new()
    }
}

impl JsonXYZPROTECT_PulseCloakuerader {
    // Remove this after Release 2
    pub fn new() -> JsonXYZPROTECT_PulseCloakuerader {
        JsonXYZPROTECT_PulseCloakuerader {
            logger: Logger::new("JsonXYZPROTECT_PulseCloakuerader"),
        }
    }

    fn unmask(&self, data: &[u8]) -> Result<UnmaskedChunk, PulseCloakueradeError> {
        let json_string = JsonXYZPROTECT_PulseCloakuerader::string_from_data(data)?;
        let structure = JsonXYZPROTECT_PulseCloakuerader::structure_from_string(json_string)?;
        let data_vector = JsonXYZPROTECT_PulseCloakuerader::data_vector_from_structure(&structure)?;
        Ok(UnmaskedChunk::new(data_vector, true, false))
    }

    fn make_text_structure(string: String) -> Result<String, serde_json::Error> {
        let structure = JsonXYZPROTECT_PulseCloakueraderStringStructure { bodyText: string };
        serde_json::to_string(&structure)
    }

    fn make_binary_structure(data: &[u8]) -> Result<String, serde_json::Error> {
        let base64 = base64::encode(data);
        let structure = JsonXYZPROTECT_PulseCloakueraderDataStructure { bodyData: base64 };
        serde_json::to_string(&structure)
    }

    fn string_from_data(data: &[u8]) -> Result<String, PulseCloakueradeError> {
        match String::from_utf8(Vec::from(data)) {
            Ok(json_string) => Ok(json_string),
            Err(_) => Err(PulseCloakueradeError::LowLevelDataError(String::from(
                "Data is not a UTF-8 string",
            ))),
        }
    }

    fn structure_from_string(
        json_string: String,
    ) -> Result<JsonXYZPROTECT_PulseCloakueraderUnmaskStructure, PulseCloakueradeError> {
        let parse_result: Result<JsonXYZPROTECT_PulseCloakueraderUnmaskStructure, serde_json::Error> =
            serde_json::from_str(&json_string[..]);
        match parse_result {
            Ok(json_structure) => Ok(json_structure),
            Err(e) => Err(PulseCloakueradeError::MidLevelDataError(if e.is_syntax() {
                "Data is not JSON".to_string()
            } else if e.is_data() {
                "JSON does not match schema".to_string()
            } else if e.is_eof() {
                "JSON was truncated".to_string()
            } else {
                format!("Unexpected JSON parsing error: {}", e)
            })),
        }
    }

    fn data_vector_from_structure(
        structure: &JsonXYZPROTECT_PulseCloakueraderUnmaskStructure,
    ) -> Result<Vec<u8>, PulseCloakueradeError> {
        match (structure.bodyText.clone(), structure.bodyData.clone()) {
            (Some(text), None) => Ok(text.into_bytes()),
            (None, Some(data)) => match base64::decode(&data[..]) {
                Ok(vec) => Ok(vec),
                Err(_) => Err(PulseCloakueradeError::HighLevelDataError(format!(
                    "Can't decode Base64: '{}'",
                    data
                ))),
            },
            (Some(_), Some(_)) => Err(PulseCloakueradeError::HighLevelDataError(
                "Found both bodyText and bodyData; can't choose".to_string(),
            )),
            (None, None) => Err(PulseCloakueradeError::HighLevelDataError(
                "Found neither bodyText nor bodyData; need one".to_string(),
            )),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[allow(non_snake_case)]
struct JsonXYZPROTECT_PulseCloakueraderStringStructure {
    bodyText: String,
}

#[derive(Serialize, Deserialize)]
#[allow(non_snake_case)]
struct JsonXYZPROTECT_PulseCloakueraderDataStructure {
    bodyData: String,
}

#[derive(Serialize, Deserialize)]
#[allow(non_snake_case)]
struct JsonXYZPROTECT_PulseCloakueraderUnmaskStructure {
    bodyText: Option<String>,
    bodyData: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use pulsecloak_lib::test_utils::logging::init_test_logging;
    use pulsecloak_lib::test_utils::logging::TestLogHandler;

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_can_mask_and_unmask_bodytext() {
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();
        let data = subject
            .mask(String::from("Fourscore and seven years ago").as_bytes())
            .unwrap();

        let unmasked_chunk = subject.try_unmask(&data[..]).unwrap();

        assert_eq!(
            String::from_utf8(unmasked_chunk.chunk).unwrap(),
            "Fourscore and seven years ago"
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_can_unmask_annoying_bodytext() {
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();
        let data = "{\"component\": \"NBHD\", \"bodyText\": \"\\\\}\\\"{'\"}".as_ref();

        let result = subject.try_unmask(data);

        assert_eq!(
            result,
            Ok(UnmaskedChunk::new(
                Vec::from("\\}\"{'".as_bytes()),
                true,
                false
            ))
        )
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_can_mask_and_unmask_bodydata() {
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();
        let data = subject.mask(&[0x7B, 0xC0, 0x7D, 0xC1]).unwrap();

        let unmasked_chunk = subject.try_unmask(&data[..]).unwrap();

        assert_eq!(unmasked_chunk.chunk, vec!(0x7B, 0xC0, 0x7D, 0xC1));
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_can_mask_utf8_text() {
        let text = "Fourscore and seven years ago";
        let data = text.as_bytes();
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();

        let result = subject.mask(data).unwrap();

        let actual_json = &String::from_utf8(result).unwrap()[..];
        let actual_structure: JsonXYZPROTECT_PulseCloakueraderStringStructure =
            serde_json::from_str(actual_json).unwrap();
        assert_eq!(
            actual_structure.bodyText,
            String::from("Fourscore and seven years ago")
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_can_mask_non_utf8_binary_data() {
        let data: &[u8] = &[0x7B, 0xC0, 0x7D, 0xC1];
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();

        let result = subject.mask(data).unwrap();

        let actual_json = &String::from_utf8(result).unwrap()[..];
        let actual_structure: JsonXYZPROTECT_PulseCloakueraderDataStructure =
            serde_json::from_str(actual_json).unwrap();
        assert_eq!(actual_structure.bodyData, String::from("e8B9wQ=="));
    }
    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_handles_json_that_terminates_prematurely() {
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();

        // White-box private-method call; only retain this test if JsonXYZPROTECT_PulseCloakuerader is not decomposed
        let result = subject
            .unmask("{\"component\": \"NBHD\", ".as_ref())
            .err()
            .unwrap();

        assert_eq!(
            result,
            PulseCloakueradeError::MidLevelDataError(String::from("JSON was truncated"))
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_handles_non_utf8_json() {
        verify_error(
            &[0x7B, 0xC0, 0x7D, 0xC1],
            "JsonXYZPROTECT_PulseCloakuerader: Low-level data error: Data is not a UTF-8 string",
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_rejects_data_that_looks_like_json_but_isnt() {
        verify_error(
            "{ goobly ][ whop }".as_ref(),
            "JsonXYZPROTECT_PulseCloakuerader: Mid-level data error: Data is not JSON",
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_handles_bad_base64() {
        verify_error(
            "{\"bodyData\": \"()[]\"}".as_ref(),
            "JsonXYZPROTECT_PulseCloakuerader: High-level data error: Can't decode Base64: '()[]'",
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_handles_both_body_text_and_body_data() {
        verify_error (
            "{\"bodyData\": \"QUJDRA==\", \"bodyText\": \"blah\"}".as_ref (),
            "JsonXYZPROTECT_PulseCloakuerader: High-level data error: Found both bodyText and bodyData; can't choose"
        );
    }

    #[test]
    fn json_XYZPROTECT_XYZPROTECT_pulsecloakuerader_handles_neither_body_text_nor_body_data() {
        verify_error(
            "{}".as_ref(),
            "Found neither bodyText nor bodyData; need one",
        );
    }

    fn verify_error(data: &[u8], msg_suffix: &str) {
        init_test_logging();
        let subject = JsonXYZPROTECT_PulseCloakuerader::new();

        let result = subject.try_unmask(data);

        assert!(result.is_err(), "{:?}", result);
        TestLogHandler::new().exists_log_containing(msg_suffix);
    }
}
