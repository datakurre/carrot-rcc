*** Settings ***

Library  RPA.Robocloud.Items
Library  Collections
Library  YOLO

*** Tasks ***

Extract items from photo
    Set task variables from work item
    ${items}=  Identify objects  ${input}
    ${results}=  Create List
    FOR  ${item}  IN  ${items}
        ${result}=  Create dictionary
        ...  name=${item}[name}  file=${item}[basename]
        Append to list  ${results}  ${result}
        Add work item file  ${item}[filename]
    END
