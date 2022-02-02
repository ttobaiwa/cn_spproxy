const express = require("express");
const router = express.Router();
const dbInst = require("../../services/db");

/* LIST all incidents */
router.get("/", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    db.all(
      `SELECT date, description, source, severity FROM incident ORDER BY id`,
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
          console.log("some rows");
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
            message: err.message,
          });
          db.close();
          return;
        }
      }
    );
  } catch (err) {
    console.error(`Error while fetching task list`, err.message);
    res.status(400).json({ error: true, message: err.message });
    next(err);
  }
});

/* LIST all tasks */
router.get("/stats/:year", async function (req, res, next) {
  // res.status(200).json({
  //   error: false,
  //   incidents: getIncidents(req.params.year),
  // });
  // return;

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
});

/* POST NEW incident */
router.post("/", async function (req, res, next) {
  try {
    const resp = await dbInst.createIncidentLog(req.body);
    if (!resp.error) {
      res.status(200).json(resp);
    } else {
      res.status(400).json(resp);
    }
  } catch (err) {
    console.error(`Error while sending message `, err.message);
    res.status(400).json({ error: true, message: err.message });
    next(err);
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
    `SELECT date, uuid, status FROM task ORDER BY id`,
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
