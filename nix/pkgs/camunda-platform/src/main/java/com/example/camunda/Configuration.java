package com.example.camunda;

import info.novatec.micronaut.camunda.bpm.feature.MnProcessEngineConfiguration;
import info.novatec.micronaut.camunda.bpm.feature.ProcessEngineConfigurationCustomizer;
import io.micronaut.context.annotation.Replaces;
import jakarta.inject.Singleton;
import org.camunda.bpm.engine.ProcessEngineConfiguration;
import org.camunda.spin.plugin.impl.SpinProcessEnginePlugin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Singleton
@Replaces(ProcessEngineConfigurationCustomizer.class)
public class Configuration implements ProcessEngineConfigurationCustomizer {

    private static final Logger log = LoggerFactory.getLogger(Configuration.class);

    @Override
    public void customize(MnProcessEngineConfiguration processEngineConfiguration) {
        processEngineConfiguration.getProcessEnginePlugins().add(new SpinProcessEnginePlugin());
        processEngineConfiguration.setDefaultSerializationFormat("application/json");

        // Allow to work around issue where server startup fails on empty db
        Map<String, String> env = System.getenv();
        if (env.get("NRestarts") == null || env.get("NRestarts").equals("0")) {
            processEngineConfiguration.setHistoryCleanupBatchWindowStartTime("22:00");
            log.info("History cleanup batch window start time set to 22:00.");
        } else {
            log.info("History cleanup batch window start time NOT set.");
        }
    }
}
