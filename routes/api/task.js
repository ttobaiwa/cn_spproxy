const express = require("express");
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();

/* LIST all tasks */
router.get("/:apiKey/:systemId", async function (req, res, next) {
  try {
    if (req.params.apiKey != process.env.API_KEY) { // check for API Key
      res.status(400).json({
        error: true,
        message: "Invalid API Key",
      });
      return;
    } else {
      const db = require("../../services/db").dbConnection();
      db.all(
        `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE systemid = '${req.params.systemId}' ORDER BY id`,
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
              message: "no tasks found",
            });
            db.close();
            return;
          }
        }
      );
    }
  } catch (err) {
    console.error(`Error while fetching task list`, err.message);
    res.status(400).json({ error: true, message: err.message });
    next(err);
  }
});

/* POST NEW task */
router.post("/:apiKey/:systemId", async function (req, res, next) {
  try {
    if (req.params.apiKey != process.env.API_KEY) { // check for API Key
      res.status(400).json({
        error: true,
        message: "Invalid API Key",
      });
      return;
    } else {
      const db = require("../../services/db").dbConnection();
      const moment = require("moment");

      const system_register = require("../store/system_register");
      const system_detail = searchInArray( // check if systemid is valid
        system_register,
        ["id"],
        req.params.systemId
      );

      db.run(
        `INSERT INTO task (date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts) VALUES(?,?,?,?,?,?,?)`,
        [
          moment().format(),
          req.params.systemId,
          req.params.systemId + "." + req.body.after,
          req.body.before,
          req.body.after,
          "pending",
          0,
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
    }
  } catch (err) {
    console.error(`Error while sending message `, err.message);
    next(err);
  }
});

module.exports = router;
