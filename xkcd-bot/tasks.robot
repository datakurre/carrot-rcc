*** Settings ***

Library  DateTime
Library  RPA.Robocorp.WorkItems
Library  SeleniumLibrary  timeout=5s
...      plugins=SeleniumTestability;True;5s;True
Library  Collections
Library  OperatingSystem
Library  requests

Suite setup  Set environment
Suite teardown  Close all browsers

*** Keywords ***

Set environment
    Set environment variable  LD_LIBRARY_PATH  %{CONDA_PREFIX}/lib:%{LD_LIBRARY_PATH}
    Log  %{LD_LIBRARY_PATH}

Run Selenium keyword and return status
    [Documentation]
    ...  Run Selenium keyword (optionally with arguments)
    ...  and return status without screenshots on failure
    [Arguments]  ${keyword}  @{arguments}
    ${tmp}=  Register keyword to run on failure  No operation
    ${status}=  Run keyword and return status  ${keyword}  @{arguments}
    Register keyword to run on failure  ${tmp}
    [Return]  ${status}

*** Tasks ***

Search for XKCD image
    Set task variables from work item

    Open browser  about:blank  browser=headlessfirefox

    Go to  https://www.google.com/search?q=site%3Am.xkcd.com+${query}
    Capture page screenshot

    ${has results}=  Run Selenium keyword and return status
    ...  Page should contain element
    ...  xpath://a[starts-with(@href, "https://m.xkcd.com/")]

    ${count}=  Get Element Count  xpath://a[starts-with(@href, "https://m.xkcd.com/")]
    ${results}=  Create list
    FOR  ${index}  IN RANGE  ${count}
        ${href}=  Get Element Attribute
        ...  xpath:(//a[starts-with(@href, "https://m.xkcd.com/")])[${{${index} + 1}}]
        ...  href
        IF  "${href}" != "https://m.xkcd.com/archive/"
            Append to list  ${results}  ${href}
        END
    END
    Set work item variable  results  ${results}
    Save work item

    Close browser

Download XKCD image
    Set task variables from work item

    Open browser  about:blank  browser=headlessfirefox
    Go to  ${url}
    Capture page screenshot

    ${has image}=  Run Selenium keyword and return status
    ...  Page should contain element
    ...  css:#comic img

    ${alt}=  Get Element Attribute  css:#comic img  alt
    ${title}=  Get Element Attribute  css:#comic img  title
    ${src}=  Get Element Attribute  css:#comic img  src
    Set work item variable  imageUrl  ${src}

    ${response}  Get  ${src}
    Create binary file  comic.png  ${response.content}
    Add work item file  comic.png
    Set work item variable  alt  ${alt}
    Set work item variable  title  ${title}
    Save work item

    Close browser
