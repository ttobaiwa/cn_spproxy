function parseJSONFromTable(table_UUId) {
    try {
        const table = document.querySelector(table_UUId);
        const [header] = table.tHead.rows;
        const props = [...header.cells].map(h => h.textContent);
        const rows = [...table.rows].map(r => {
            const entries = [...r.cells].map((c, i) => {
                return [props[i], c.textContent];
            })
            return Object.fromEntries(entries);
        })
        return rows;
    } catch (error) {
        console.log(error);
        return [];
    }
}

function trimObjValues(obj) {
    return Object.keys(obj).reduce((acc, curr) => {
        acc[curr] = obj[curr].trim()
        return acc;
    }, {});
}

function stripTags(original) {
    try {
        let result = original.replace(/&lt;/g, "<");
        result = result.replace(/&gt;/g, ">");
        result = result.replace(/"/g, "");
        result = result.replaceAll("style=cursor:pointer class=ResultRow onmouseover=JavaScript: Navigator.HighlightRow(this); onmouseout=JavaScript: Navigator.UnHighlightRow(this)", "");

        result = result.replaceAll("<string xmlns=http://www.strandtechnology.co.uk/carenotes/><div style=margin: 2px xmlns:cn=http://www.strandtechnology.co.uk/carenotes>", "");
        result = result.replaceAll("</string>", "");
        result = result.replaceAll("style=width: 50px; color: #94A2AD; text-align:center;", '');
        result = result.replaceAll("<td>", "<th>");
        result = result.replaceAll("<?xml version=1.0 encoding=utf-8?>", "");
        result = result.replaceAll("class=ResultCell style=color: #94A2AD", "");
        result = result.replaceAll("class=ResultCell", "");
        result = result.replaceAll("style=color: #1A5993; font-size: medium", "");
        result = result.replaceAll("style=font-size: 14px", "");
        result = result.replaceAll(" >", ">"); // formatting
        result = result.replaceAll("> ", ">");
        result = result.replaceAll(" <", "<");

        let resultTableSection = result.substring(result.indexOf("<th>"), result.indexOf("</tr>"));
        let newResultTableSection = resultTableSection.replaceAll("</td>", "</th>");
        result = result.replace(resultTableSection, newResultTableSection);

        let tableSection = result.substring(result.indexOf("<table"), result.indexOf("</table>") + 8); // this is the table
        let currentPos = tableSection.indexOf("<div style"); // we are looking for this

        while (currentPos > -1) {
            let tmpContent = tableSection.substring(currentPos + 4); //starts from the current postion
            let tagContents = tableSection.substring(currentPos + 4, currentPos + 4 + tmpContent.indexOf(">")); // this is what needs to be replaced
            tableSection = tableSection.replace(tagContents, ''); // replace with this
            currentPos = tableSection.indexOf("<div style"); // this becomes the next position, breaks the loop if not there
        }

        let table_UUId = crypto.randomUUID(); // all tables have to be unique
        table_UUId = table_UUId.replaceAll("-", "");

        tableSection = tableSection.replace("<table>", '<table id="' + table_UUId + '"><thead>'); // add table header
        tableSection = tableSection.replace("</tr>", '</tr></thead><tbody>'); // close header, add body
        tableSection = tableSection.replace("</table>", '</tbody></table>'); // close body

        let divTable = document.createElement("div"); //create new <div>
        divTable.id = "D_" + table_UUId;
        divTable.innerHTML = tableSection;

        let body = document.querySelector("body"); //change to the preferred selector
        body.append(divTable); //append new <div> to the selected Element, in this case <body>
        let obj = parseJSONFromTable("[id='" + table_UUId + "']");

        obj = JSON.stringify(obj);
        obj = obj.replace(/[\r\n]/gm, '').replaceAll("  ", "");
        
        return obj; // pass it as a string
    } catch (error) {
        console.log(error);
        return [];
    }
}

function getDashboardReport (reportName, reportType, dashboardID, reportID, reportControlValues) {

    var myHeaders = new Headers();
    myHeaders.append("RequestSynchronizationToken", synchronizationToken);
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var urlencoded = new URLSearchParams();
    urlencoded.append("dashboardID", dashboardID);
    urlencoded.append("reportID", reportID);
    urlencoded.append("reportControlValues", reportControlValues);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    };

    fetch("https://carenotes.stmagnus.co.uk/CarenotesLive/(S(" + ServerSessionID + "))/ws.asmx/DashboardGetReportHTML", requestOptions)
        .then(response => response.text())
        .then(result => { 
            const res = stripTags(result);
            console.log(`${reportName} -> `, res);
            submitReportToCloud({
                summary: reportName,
                content: res,
                type: reportType,
                source: "carenotes",
              });
            return res;
         })
        .catch(error => { console.log('error', error); return []; });
};

function submitReportToCloud (payload) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify(payload);
  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch("https://carenotesplus.herokuapp.com/api/report/new", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}

$(document).ready(function () {
    getDashboardReport("St Magnus - Occupancy", "occupancy", 4, 29, "");
    getDashboardReport("St Martha's - Occupancy", "occupancy", 4, 30, "");
    getDashboardReport("Wards Summary", "wards_summary", 4, 33, "");
});