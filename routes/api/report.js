const express = require("express");
const router = express.Router();
/* 
       source => [carenotes, ulysses, other]
       type => [occupancy, incident, other]
       reports: date, summary, content, type, source
    */

/* LIST all reports */
router.get("/all", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    db.all(
      `SELECT date, summary, content, type, source FROM reports ORDER BY id`,
      [],
      (err, rows) => {
        if (err) {
          //throw err.message;
          res.status(400).json({
            error: true,
            message: err.message,
          });
          db.close();
          return;
        }
        if (rows.length > 0) {
          console.log("found something");
          res.status(200).json({
            error: false,
            data: rows,
          });
          db.close();
          return;
        } else {
          console.log("no rows");
          res.status(400).json({
            error: true,
            message: "no report(s) found",
          });
          db.close();
          return;
        }
      }
    );
  } catch (err) {
    console.error(`Error while fetching report list`, err.message);
    res.status(400).json({ error: true, message: err.message });
    next(err);
  }
});

/* GET single report */
router.get("/:reportid", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    db.all(
      `SELECT date, summary, content, type, source FROM reports WHERE id = '${req.params.reportid}' ORDER BY id`,
      [],
      (err, rows) => {
        if (err) {
          //throw err.message;
          res.status(400).json({
            error: true,
            message: err.message,
          });
          db.close();
          return;
        }
        if (rows.length > 0) {
          console.log("found something");
          res.status(200).json({
            error: false,
            data: rows,
          });
          db.close();
          return;
        } else {
          console.log("no rows");
          res.status(400).json({
            error: true,
            message: "no report(s) found",
          });
          db.close();
          return;
        }
      }
    );
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
    const moment = require("moment");
    db.run(
      `INSERT INTO report (date, summary, content, type, source) VALUES(?,?,?,?,?)`,
      [
        moment().format(),
        req.body.summary,
        req.body.content,
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
