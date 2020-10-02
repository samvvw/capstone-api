const express = require('express');
const timesheetsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId`;
  const values = { $timesheetId: timesheetId };
  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.status(404).send();
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId`;
  const values = req.params.employeeId;
  db.all(sql, values, (err, timesheets) => {
    if (err) {
      next(err);
    }
    res.status(200).json({ timesheets: timesheets });
  });
});

timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;

  if (!hours || !rate || !date) {
    res.status(400).send();
  } else {
    const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`;
    const values = {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: req.employee.id,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
          (err, timesheet) => {
            res.status(201).json({ timesheet: timesheet });
          }
        );
      }
    });
  }
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const { hours, rate, date } = req.body.timesheet;
  const timesheetId = req.timesheet.id;
  const employeeId = req.employee.id;

  const employeeSql = `SELECT * FROM Employee WHERE Employee.id = $employeeId`;
  const employeeValues = { $employeeId: employeeId };

  db.get(employeeSql, employeeValues, (err, employee) => {
    if (!hours || !rate || !date || !employee) {
      return res.status(400).send();
    }
    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = $timesheetId`;
    const values = {
      $hours: hours,
      $rate: rate,
      $date: date,
      $timesheetId: timesheetId,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`,
          (err, timesheet) => {
            res.status(200).json({ timesheet: timesheet });
          }
        );
      }
    });
  });
});

module.exports = timesheetsRouter;
