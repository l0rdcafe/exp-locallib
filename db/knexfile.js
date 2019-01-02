require("dotenv").config();

module.exports = {
  client: "pg",
  connection: {
    database: process.env.DB_NAME
  },
  pool: { min: 1, max: 7 }
};
