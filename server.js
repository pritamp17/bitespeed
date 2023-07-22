const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
const port = 3016;

// Middleware for parsing JSON
app.use(bodyParser.json());

// Registering contact routes
app.use('/contacts', routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});