const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

const menuItemsRouter = require('./menuItems');

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
  const values = { $menuId: menuId };
  db.get(sql, values, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else res.status(404).send();
  });
});

menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menus: menus });
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({ menu: req.menu });
});

menusRouter.post('/', (req, res, next) => {
  const { title } = req.body.menu;
  if (!title) {
    return res.status(400).send();
  }
  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  const values = { $title: title };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (err, menu) => {
          res.status(201).json({ menu: menu });
        }
      );
    }
  });
});

menusRouter.put('/:menuId', (req, res, next) => {
  const { title } = req.body.menu;
  if (!title) {
    return res.status(400).send();
  }
  const sql = `UPDATE Menu SET title = $title WHERE id = $menuId`;
  const values = {
    $title: title,
    $menuId: req.menu.id,
  };
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM Menu WHERE Menu.id = ${req.menu.id}`,
        (err, menu) => {
          res.status(200).json({ menu: menu });
        }
      );
    }
  });
});

// menusRouter.delete('/:menuId', (req, res, next) =>{

// })

module.exports = menusRouter;
