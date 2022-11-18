const express = require("express");
const router = express.Router();
/* 
    source => [carenotes, ulysses, other]
    type => [occupancy, incident, other]
    reports: date, summary, content, type, source
*/

/* GET single reports */
router.get("/:reportid/:type?/:source?", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    let searchQuery = "";
    if (req.params.reportid === "latest" || req.params.reportid === "all") {
      let searchQueryType =
        req.params.type !== "" && req.params.type !== undefined
          ? `type = '${req.params.type}'`
          : "";
      let searchQuerySource =
        req.params.source !== "" && req.params.source !== undefined
          ? `source = '${req.params.source}'`
          : "";

      if (searchQueryType !== "") {
        searchQuery = ` WHERE ${searchQueryType}`;
        if (searchQuerySource !== "") {
          searchQuery = `${searchQuery} AND ${searchQuerySource}`;
        }
      } else {
        if (searchQuerySource !== "") {
          searchQuery = ` WHERE ${searchQuerySource}`;
        }
      }

      if (req.params.reportid === "all") {
        searchQuery = `${searchQuery} ORDER BY id DESC`; // returns all + criteria
      } else {
        searchQuery = `${searchQuery} ORDER BY id DESC LIMIT 1`; // returns only one + criteria
      }
    } else {
      // search by id
      searchQuery = ` WHERE id = '${req.params.reportid}' `;
    }

    searchQuery = `SELECT id, date, summary, content, type, source FROM reports ${searchQuery}`;
    db.all(searchQuery, [], (err, rows) => {
      if (err) {
        //throw err.message;
        res.status(400).json({
          error: true,
          message: err.message,
          query: searchQuery,
        });
        db.close();
        return;
      }
      if (rows.length > 0) {
        console.log("found something");
        let parsedRows = [];
        rows.forEach(myFunction);

        function myFunction(item, index) {
          parsedRows.push({
            id: item.id,
            summary: item.summary,
            content: JSON.parse(item.content),
            type: item.type,
            source: item.source,
          });
        }

        res.status(200).json({
          error: false,
          data: parsedRows,
          query: searchQuery,
        });
        db.close();
        return;
      } else {
        console.log("no rows");
        res.status(400).json({
          error: true,
          message: "no report(s) found",
          query: searchQuery,
        });
        db.close();
        return;
      }
    });
  } catch (err) {
    console.error(`Error while fetching report list`, err.message);
    res.status(400).json({ error: true, message: err.message });
    next(err);
  }
});

/* POST NEW report */
router.post("/new", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    // scrub content
    // let payload = req.body.content;
    let parsedRows = [];
    JSON.parse(req.body.content).forEach(scrubContents);
    function scrubContents(item, index) {
      let scrubbedItem = {};
      for (const [key, value] of Object.entries(item)) {
        const parsedKey = key
          .replace(/[\r\n]/gm, "")
          .replaceAll("  ", "")
          .trim();
        const parsedValue = value
          .replace(/[\r\n]/gm, "")
          .replaceAll("  ", "")
          .trim();
        scrubbedItem = Object.assign(scrubbedItem, { [parsedKey]: parsedValue });
      }
      parsedRows.push(scrubbedItem);
    }

    const moment = require("moment");
    db.run(
      `INSERT INTO reports (date, summary, content, type, source) VALUES(?,?,?,?,?)`,
      [
        moment().format(),
        req.body.summary,
        JSON.stringify(parsedRows),
        req.body.type,
        req.body.source,
      ],
      function (err) {
        if (err) {
          res.status(400).json({
            error: true,
            message: err.message,
          });
          return;
        }
        res.status(200).json({
          error: false,
          data: this.lastID,
        });
        return;
      }
    );
    db.close();
  } catch (err) {
    console.error(`Error while sending message `, err.message);
    next(err);
  }
});

module.exports = router;
