const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);
const timesheetsRouter = require('./timesheets');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee WHERE id = $employeeId`;
  const values = {
    $employeeId: employeeId,
  };
  db.get(sql, values, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      req.id = employee.id;
      next();
    } else {
      res.status(404).send();
    }
  });
});

employeesRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM Employee WHERE Employee.is_current_employee = 1`,
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ employees: employees });
      }
    }
  );
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({ employee: req.employee });
});

employeesRouter.post('/', (req, res, next) => {
  const { name, position, wage } = req.body.employee;

  if (!name || !position || !wage) {
    res.status(400).send();
  } else {
    const sql = `INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`;
    const values = {
      $name: name,
      $position: position,
      $wage: wage,
    };

    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Employee WHERE id = ${this.lastID}`,
          (err, employee) => {
            res.status(201).json({ employee: employee });
          }
        );
      }
    });
  }
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const { name, position, wage } = req.body.employee;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    res.status(400).send();
  } else {
    const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId`;
    const values = {
      $name: name,
      $position: position,
      $wage: wage,
      $isCurrentEmployee: isCurrentEmployee,
      $employeeId: req.id,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Employee WHERE Employee.id = ${req.id}`,
          (err, employee) => {
            res.status(200).json({ employee: employee });
          }
        );
      }
    });
  }
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId`;
  const values = {
    $employeeId: req.id,
  };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM Employee WHERE Employee.id = ${req.id}`,
        (err, employee) => {
          res.status(200).json({ employee: employee });
        }
      );
    }
  });
});

module.exports = employeesRouter;
