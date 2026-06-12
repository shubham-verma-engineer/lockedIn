package com.lockedin.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SpringSchedulerWrapper {

    private final NotificationScheduler notificationScheduler;

    public SpringSchedulerWrapper(NotificationScheduler notificationScheduler) {
        this.notificationScheduler = notificationScheduler;
    }

    /**
     * Executes the background streak poll every 60 seconds (on the 0th second of every minute).
     */
    @Scheduled(cron = "0 * * * * *")
    public void scheduleMinutePoll() {
        notificationScheduler.runMinutePoll();
    }
}
