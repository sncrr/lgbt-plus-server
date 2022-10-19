/**
 * NodeJS Modules
 */
const express = require('express');
// const cors = require('cors');

/**
 * Express Settigns
 */
const app = express();
// app.use(cors());
app.use(express.json());
app.use(express.static('build'));
app.use(express.urlencoded({
  extended: true
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// app.options('*', cors());

/**
 * Initialize API
 */
const initApi = require('./routes/api');

/**
 * Listen to Any Request
 */
app.listen(process.env.PORT || 8080, () => {
  //console.log(`Server is running on port ${config.server.url}:${config.server.port}...`);
  console.log(`Server is running on port...`);
});

app.get("/", (req, res) => {
  res.send("Hello World");
})

// app.get("/api/admin/:adminId", (req, res) => {
//   res.json({
//     req: {
//       params: req.params,
//       body: req.body,
//       query: req.query,
//       url: req.url
//     }
//   });
// })

initApi(app);

