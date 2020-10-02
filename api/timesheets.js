const express = require('express');
const timesheetsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

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
      $employeeId: req.id,
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

module.exports = timesheetsRouter;
