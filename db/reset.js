const config = require("./knexfile");
const knexFn = require("knex");

async function exec(query) {
  const knexInstance = knexFn({
    ...config,
    connection: { ...config.connection, database: "postgres" },
    pool: { min: 1, max: 1 }
  });

  try {
    await knexInstance.raw(query);
  } finally {
    await knexInstance.destroy();
  }
}

function terminateConns() {
  const query = `
    select pg_terminate_backend(pg_stat_activity.pid)
    from pg_stat_activity
    where datname = '${config.connection.database}'
    and pid <> pg_backend_pid()
  `;
  return exec(query);
}

function dropDB() {
  return exec(`drop database '${config.connection.database}'`);
}

function createDB() {
  return exec(`create database '${config.connection.database}'`);
}

async function main() {
  try {
    // uses knex instance with the 'postgres' database
    await terminateConns();
    await dropDB();
    await createDB();

    // uses the real knex instnace
    const knex = knexFn(config);
    await knex.migrate.latest();
    await knex.seed.run();
    await knex.destroy();
  } catch (err) {
    console.log(err);
    process.exit(1)
  }
}

main();
