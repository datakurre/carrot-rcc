package com.example.camunda;

import info.novatec.micronaut.camunda.bpm.feature.ProcessEngineFactory;
import info.novatec.micronaut.camunda.bpm.feature.Configuration;
import io.micronaut.context.annotation.Replaces;
import jakarta.inject.Singleton;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.migration.MigrationInstructionsBuilder;
import org.camunda.bpm.engine.migration.MigrationPlan;
import org.camunda.bpm.engine.migration.MigrationPlanExecutionBuilder;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.repository.ProcessDefinitionQuery;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Singleton
@Replaces(ProcessEngineFactory.class)
public class Engine extends ProcessEngineFactory {
    private static final Logger log = LoggerFactory.getLogger(Engine.class);

    @Override
    protected void deployProcessModels(ProcessEngine processEngine, Configuration configuration) throws IOException {
        super.deployProcessModels(processEngine, configuration);

        RepositoryService repositoryService = processEngine.getRepositoryService();
        RuntimeService runtimeService = processEngine.getRuntimeService();

        ProcessDefinitionQuery processDefinitionQuery = repositoryService.createProcessDefinitionQuery();
        List<ProcessDefinition> processDefinitionList = processDefinitionQuery.latestVersion().list();

        for (ProcessDefinition processDefinition: processDefinitionList) {

            ProcessInstanceQuery processInstanceQuery = runtimeService.createProcessInstanceQuery();
            List<ProcessInstance> processInstanceList = processInstanceQuery.processDefinitionKey(processDefinition.getKey()).list();

            for (ProcessInstance processInstance: processInstanceList) {

                String processDefinitionId = processInstance.getProcessDefinitionId();
                ProcessDefinition localProcessDefinition = repositoryService.createProcessDefinitionQuery().processDefinitionId(processDefinitionId).singleResult();

                if (localProcessDefinition.getVersion() < processDefinition.getVersion()) {

                    List<String> processInstanceIds = new ArrayList<>();
                    processInstanceIds.add(processInstance.getId());
                    MigrationInstructionsBuilder instructionsBuilder = runtimeService.createMigrationPlan(localProcessDefinition.getId(), processDefinition.getId()).mapEqualActivities();
                    MigrationPlan migrationPlan = instructionsBuilder.updateEventTriggers().build();
                    MigrationPlanExecutionBuilder executionBuilder = runtimeService.newMigration(migrationPlan).processInstanceIds(processInstanceIds);

                    try {
                        executionBuilder.execute();
                    } catch(Exception e) {
                        log.warn(e.toString());
                    }
                }
            }
        }
    }
}
