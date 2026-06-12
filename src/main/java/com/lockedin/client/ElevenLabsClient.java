package com.lockedin.client;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

public class ElevenLabsClient {

    private final String apiKey;
    private final String voiceUrlTemplate;
    private final boolean simulated;
    private final RestTemplate restTemplate;

    public ElevenLabsClient(String apiKey, String voiceUrlTemplate, boolean simulated) {
        this.apiKey = apiKey;
        this.voiceUrlTemplate = voiceUrlTemplate;
        this.simulated = simulated;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Calls ElevenLabs Text-to-Speech API to synthesize text with the given voiceId.
     * If simulated is true, returns mock audio bytes.
     *
     * @param text    The motivation roast text message to synthesize.
     * @param voiceId The ElevenLabs voice clone ID.
     * @return Generated audio bytes.
     */
    public byte[] synthesizeText(String text, String voiceId) {
        if (simulated) {
            // Return mock audio bytes (simple UTF-8 byte array of the text)
            return text.getBytes();
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${ELEVENLABS_API_KEY}")) {
            throw new IllegalStateException("ElevenLabs API Key is not configured.");
        }

        String url = voiceUrlTemplate.replace("{voice_id}", voiceId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("xi-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("text", text);
        body.put("model_id", "eleven_monolingual_v1");

        Map<String, Object> voiceSettings = new HashMap<>();
        voiceSettings.put("stability", 0.5);
        voiceSettings.put("similarity_boost", 0.75);
        body.put("voice_settings", voiceSettings);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.postForEntity(url, entity, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("ElevenLabs API responded with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call ElevenLabs Text-to-Speech API: " + e.getMessage(), e);
        }
    }
}
