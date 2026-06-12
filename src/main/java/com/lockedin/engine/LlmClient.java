package com.lockedin.engine;

// Internal HTTP abstraction for LLM calls (OpenAI/Anthropic SDK wrapper interface)
public interface LlmClient {
    String call(String systemPrompt, String userPrompt);
}
