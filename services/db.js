const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
var shell = require("shelljs");
const system_register = require("../store/system_register");

async function createDatabase() {
  /* create database + tables */

  let db = dbConnection();
  db.run(
    "CREATE TABLE IF NOT EXISTS task (id INTEGER PRIMARY KEY, date TEXT, systemid TEXT, uuid TEXT, previous_point_marker TEXT, current_point_marker TEXT, status TEXT, attempts INTEGER);"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS incident (id INTEGER PRIMARY KEY, date TEXT, description TEXT, source TEXT, severity TEXT);"
  );
  db.close();
}

/* ---------- TASK LOGS ---------- */

async function createTaskLog(actionLog) {
  /* create new single log entry */

  let db = dbConnection();
  db.run(
    "INSERT INTO task (date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts) VALUES(?,?,?,?,?,?,0)",
    [
      moment().format(),
      actionLog.systemid,
      actionLog.uuid,
      actionLog.previous_point_marker,
      actionLog.current_point_marker,
      actionLog.status,
    ],
    function (err) {
      if (err) {
        return {
          error: true,
          message: err.message,
        };
      }
      return {
        error: false,
        data: this.lastID,
      };
    }
  );
  db.close();
}

async function updateTaskLog(actionLog) {
  /* update single log entry */

  let db = dbConnection();
  db.run(
    `UPDATE task SET status = '${actionLog.status}', attempts = attempts + 1 WHERE uuid = '${actionLog.uuid}'`,
    [],
    function (err) {
      if (err) {
        return {
          error: true,
          message: err.message,
        };
      }
      return {
        error: false,
        data: this.lastID,
      };
    }
  );
  db.close();
}

async function listTaskLog(selectedSystemId, selectedTaskStatus) {
  /* get all logs */

  let sql =
    selectedSystemId.length > 0
      ? `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE systemid = '${selectedSystemId}'`
      : `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE status = '${selectedTaskStatus}' ORDER BY id`;

  let db = dbConnection();
  var message = [];
  db.all(sql, [], (err, rows) => {
    if (err) {
      //throw err.message;
      message = {
        error: true,
        message: err.message,
      };
      return message;
    }

    if (rows.length > 0) {
      console.log("some rows");
      message = {
        error: false,
        data: rows,
      };
      return message;
    } else {
      console.log("no rows");
      message = {
        error: true,
        message: "no records found",
      };
      return message;
    }
  });

  console.log("done");
  db.close();
}

async function processPendingTasks() {
  let sql = `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
  let db = dbConnection();
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err.message;
      return false;
    }

    if (rows.length > 0) {
      rows.forEach((task) => {
        console.log("task => ", task);
        // systemid
        // uuid:

        const system_detail = searchInArray(
          system_register,
          ["id"],
          task.systemid
        );

        console.log("system => ", system_detail[0].name);

        if (
          shell.exec(
            `cd ${system_detail[0].path} && ${system_detail[0].deploy.pull}`
          ).code == 0
        ) {
          // no errors - let's update the table
          updateTaskLog({ status: "completed", uuid: task.uuid });
        } else {
          // errors - gonna have to try again
          updateTaskLog({ status: "pending", uuid: task.uuid });
        }
      });

      return true;
    }
  });

  console.log("done -> test()");
  db.close();
  setTimeout(processPendingTasks, 5000);
}

/* ---------- INCIDENT LOGS ---------- */

async function createIncidentLog(incidentLog) {
  /* create new single log entry */

  let db = dbConnection();
  db.run(
    `INSERT INTO incident (date, description, source, severity) VALUES(?,?,?,?)`,
    [
      moment().format(),
      incidentLog.description,
      incidentLog.source,
      incidentLog.severity,
    ],
    function (err) {
      if (err) {
        return {
          error: true,
          message: err.message,
        };
      }
      return {
        error: false,
        data: this.lastID,
      };
    }
  );
  db.close();
}

async function listIncidentLogs(selectedYear) {
  /* get all logs */

  let sql = `SELECT date, description, source, severity FROM incident ORDER BY id`;
  let db = dbConnection();
  var message = [];
  db.all(sql, [], (err, rows) => {
    if (err) {
      //throw err.message;
      message = {
        error: true,
        message: err.message,
      };
      return message;
    }
    if (rows.length > 0) {
      console.log("some rows");
      message = {
        error: false,
        data: rows,
      };
      return message;
    } else {
      console.log("no rows");
      message = {
        error: true,
        message: "no records found",
      };
      return message;
    }
  });

  console.log("done");
  db.close();
}

/* ---------- AUXILARY FUNCTIONS ---------- */
function dbConnection() {
  return new sqlite3.Database(
    "./db/ci_cicd_webhook.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the logs database.");
    }
  );
}

const searchInArray = (haystack, criteria, needle) => {
  return haystack.filter((hay) => {
    return criteria.some(
      (newItem) =>
        hay[newItem].toString().toLowerCase().indexOf(needle.toLowerCase()) > -1
    );
  });
};

module.exports = {
  createTaskLog,
  updateTaskLog,
  listTaskLog,
  checkForPendingTasks: processPendingTasks,
  createIncidentLog,
  listIncidentLogs,
  createDatabase,
  dbConnection,
  test: processPendingTasks,
};
