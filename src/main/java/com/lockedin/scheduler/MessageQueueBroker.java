package com.lockedin.scheduler;

/**
 * Message Queue Broker contract interface for publishing payloads.
 */
public interface MessageQueueBroker {
    /**
     * Pushes a payload onto a specified message queue.
     *
     * @param queueName The target queue name.
     * @param payload   The payload object to serialize and push.
     */
    void push(String queueName, Object payload);
}
