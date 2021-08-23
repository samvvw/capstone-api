const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorhandler = require('errorhandler');

const PORT = process.env.PORT || 4000;
const apiRouter = require('./api/api');

app.use(express.json());
app.use(cors());
// app.use(morgan('dev'));

app.use('/api', apiRouter);
app.use(errorhandler());

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

module.exports = app;
