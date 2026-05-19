require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',        require('./src/routes/auth'));
app.use('/api/users',       require('./src/routes/users'));
app.use('/api/trainings',   require('./src/routes/trainings'));
app.use('/api/assignments', require('./src/routes/assignments'));
app.use('/api/dashboard',   require('./src/routes/dashboard'));
app.use('/api/reports',     require('./src/routes/reports'));

app.use(errorHandler);

module.exports = app;
