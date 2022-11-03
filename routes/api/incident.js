const express = require("express");
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();

/* LIST all incidents from a year */
router.get("/stats/:apiKey/:year", async function (req, res, next) {
  if (req.params.apiKey != process.env.API_KEY) { // check for API Key
    res.status(400).json({
      error: true,
      message: "Invalid API Key",
    });
    return;
  } else {
    if (!req.params.year.toString().match(/^[0-9]{4}$/g)) {
      res.status(400).json({
        error: true,
        message: "Invalid value for a year",
      });
    } else {
      getIncidents(req.params.year, function (err, result1) {
        if (err) {
          res.status(400).json({
            error: true,
            message: err.message,
          });
          return;
        } else {
          getTasks(req.params.year, function (err, result2) {
            if (err) {
              res.status(400).json({
                error: true,
                message: err.message,
              });
              return;
            } else {
              res.status(200).json({
                error: false,
                data: { incidents: result1, tasks: result2 },
              });
              return;
            }
          });
        }
      });
    }
  }
});

function getIncidents(selectedYear, callback) {
  const db = require("../../services/db").dbConnection();
  db.all(
    `SELECT date, description, source, severity FROM incident ORDER BY id`,
    [],
    function (err, rows) {
      db.close();
      if (err) {
        callback(null, []);
      } else {
        // get rows with callback
        if (rows.length > 0) {
          const filtered = rows.filter((incident) => {
            return incident.date.split("-")[0] == selectedYear;
          });
          callback(null, filtered);
        } else {
          callback(null, []);
        }
      }
    }
  );
}

function getTasks(selectedYear, callback) {
  const db = require("../../services/db").dbConnection();
  db.all(
    `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task ORDER BY id`,
    [],
    function (err, rows) {
      if (err) {
        db.close();
        callback(null, []);
      } else {
        if (rows.length > 0) {
          const filtered = rows.filter((task) => {
            return task.date.split("-")[0] == selectedYear;
          });
          callback(null, filtered);
        } else {
          callback(null, []);
        }
      }
    }
  );
}

module.exports = router;
