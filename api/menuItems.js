const express = require('express');
const menuItemsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId`;
  const values = { $menuItemId: menuItemId };
  db.get(sql, values, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`;
  const values = { $menuId: req.menu.id };
  db.all(sql, values, (err, items) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menuItems: items });
    }
  });
});

menuItemsRouter.post('/', (req, res, next) => {
  const { name, description, inventory, price } = req.body.menuItem;
  if (!name || !description || !inventory || !price) {
    return res.status(400).send();
  }
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)`;
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: req.menu.id,
  };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
        (err, menuItem) => {
          res.status(201).json({ menuItem: menuItem });
        }
      );
    }
  });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const { name, description, inventory, price } = req.body.menuItem;
  if (!name || !description || !inventory || !price) {
    return res.status(400).send();
  }
  const sql = `UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE MenuItem.id = $menuItemId`;
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuItemId: req.menuItem.id,
  };
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItem.id}`,
        (err, menuItem) => {
          res.status(200).json({ menuItem: menuItem });
        }
      );
    }
  });
});

module.exports = menuItemsRouter;
