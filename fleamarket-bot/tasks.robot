*** Settings ***

Library  RPA.Robocloud.Items
Library  RPA.Excel.Files
Library  Collections
Library  Image
Library  YOLO

*** Tasks ***

Extract items from photo
    Set task variables from work item
    ${items}=  Identify objects  ${input}
    Set work item variable  items  ${items}
    Save work item

Crop image
    Set task variables from work item
    ${filename}=  Crop image
    ...  ${input}  ${name}  ${x}  ${y}  ${width}  ${height}
    ...  output=${OUTPUT_DIR}
    Set work item variable  output  ${filename}
    Add work item file  ${OUTPUT_DIR}${/}${filename}
    Save work item

Create JSON array
    ${output}=  Create list
    Set work item variable  output  ${output}
    Save work item

Update JSON object
    Set task variables from work item
    ${keys}=  Get dictionary keys  ${b}
    FOR  ${key}  IN  @{keys}
      Set to dictionary  ${a}  ${key}  ${b}[${key}]
    END
    Set work item variable  a  ${a}
    Save work item

Save items to spreadsheet
    Set task variables from work item
    Create workbook  fmt=xlsx
    Set worksheet value  1  A  Item
    Set worksheet value  1  B  Price
    Set worksheet value  1  C  Image
    ${row}=  Set variable  2
    FOR  ${item}  IN  @{input}
      Set worksheet value  ${row}  A  ${item}[name]
      Set worksheet value  ${row}  B  ${item}[price]
      Insert image to worksheet  ${row}  C  ${${item}[filename]}  0.5
      ${row}=  Evaluate  ${row} + 1
    END
    Save workbook  ${OUTPUT_DIR}${/}items.xslx
    Set work item variable  output  items.xslx
    Add work item file  ${OUTPUT_DIR}${/}items.xslx
    Save work item
