exports.up = function(knex, Promise) {
  return knex.schema.createTable("authors", t => {
    t.increments("id").primary();
    t.string("first_name").notNull();
    t.string("family_name").notNull();
    t.date("date_of_birth");
    t.date("date_of_death");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("authors");
};
