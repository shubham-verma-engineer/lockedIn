package com.lockedin.engine;

import com.lockedin.client.ElevenLabsClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

public class VoiceCloningSynthesizer {

    public static final String SECRET_KEY = "LockedInServerSecretKey_ForAudioSecurePreSignedTokens_2026";
    private final ElevenLabsClient elevenLabsClient;

    public VoiceCloningSynthesizer(ElevenLabsClient elevenLabsClient) {
        this.elevenLabsClient = elevenLabsClient;
    }

    /**
     * Synthesizes audio using ElevenLabs integration and returns a pre-signed audio clip URL.
     * Throws an exception if simulateFailure is true or ElevenLabs client fails to allow fallback validation.
     *
     * @param text             The motivation roast text to synthesize.
     * @param voiceCloneId     The ID of the user's voice clone clip.
     * @param simulateFailure  Set to true to simulate an external API failure.
     * @return A secure local URL referencing the synthesized clip.
     */
    public String synthesizeVoiceRoast(String text, String voiceCloneId, boolean simulateFailure) {
        if (simulateFailure) {
            throw new RuntimeException("External Voice Synthesis API (ElevenLabs) has timed out or failed to connect.");
        }

        // Call ElevenLabs client to obtain synthesized audio bytes
        byte[] audioBytes = elevenLabsClient.synthesizeText(text, voiceCloneId);

        // Generate dynamic clip ID and write audio files to local media folder
        String clipId = UUID.randomUUID().toString().replace("-", "");
        File mediaDir = new File("media");
        if (!mediaDir.exists()) {
            mediaDir.mkdirs();
        }

        File audioFile = new File(mediaDir, clipId + ".mp3");
        try (FileOutputStream fos = new FileOutputStream(audioFile)) {
            fos.write(audioBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store synthesized audio clip locally", e);
        }

        // Generate pre-signed expiration and signature token
        long expirationTime = (System.currentTimeMillis() / 1000) + 3600; // 1 hour expiration
        String signature = generateSignature(clipId, expirationTime);

        return "/api/motivation/audio/" + clipId + 
               "?token=" + signature + 
               "&expires=" + expirationTime;
    }

    /**
     * Generates a SHA-256 signature for verification.
     */
    public static String generateSignature(String clipId, long expires) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = clipId + ":" + expires + ":" + SECRET_KEY;
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate security signature", e);
        }
    }
}

