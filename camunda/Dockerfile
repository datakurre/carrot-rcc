FROM camunda/camunda-bpm-platform:7.15.0
USER camunda
RUN set -xe && \
    # https://github.com/datakurre/camunda-cockpit-plugins/ OR https://datakurre.pandala.org/2021/01/camunda-cockpit-history-plugin/ installation
    wget -P /camunda/webapps/camunda/app/cockpit/scripts/ https://raw.githubusercontent.com/datakurre/camunda-cockpit-plugins/master/definition-historic-activities.js && \
    wget -P /camunda/webapps/camunda/app/cockpit/scripts/ https://raw.githubusercontent.com/datakurre/camunda-cockpit-plugins/master/instance-historic-activities.js && \
    wget -P /camunda/webapps/camunda/app/cockpit/scripts/ https://raw.githubusercontent.com/datakurre/camunda-cockpit-plugins/master/instance-route-history.js && \
    # https://github.com/datakurre/camunda-modeler-robot-plugin OR https://forum.robotframework.org/t/integrating-rf-with-camunda/997 installation
    wget -P /camunda/webapps/camunda/app/cockpit/scripts/ https://raw.githubusercontent.com/datakurre/camunda-modeler-robot-plugin/master/dist/module.js
RUN set -xe && \
    # Jupyter Lite
    curl -L https://github.com/datakurre/camunda-cockpit-plugin-jupyter/archive/refs/heads/main.tar.gz|tar xzvf - && \
    mv camunda-cockpit-plugin-jupyter-main/jupyter /camunda/webapps/camunda/app/cockpit/scripts && \
    mv camunda-cockpit-plugin-jupyter-main/jupyter-lite-route.js /camunda/webapps/camunda/app/cockpit/scripts && \
    rm -r camunda-cockpit-plugin-jupyter-main
COPY --chown=camunda:camunda cockpit/config.js /camunda/webapps/camunda/app/cockpit/scripts/.
COPY --chown=camunda:camunda deployment /tmp/deployment
COPY --chown=camunda:camunda web.xml /camunda/conf/web.xml

