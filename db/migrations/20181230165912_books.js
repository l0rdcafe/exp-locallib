exports.up = function(knex, Promise) {
  return knex.schema.createTable("books", t => {
    t.increments("id").primary();
    t.string("title").notNull();
    t.string("summary");
    t.bigInteger("isbn");
    t.integer("author_id").notNullable();
    t.integer("genre_id");
    t.foreign("author_id")
      .references("id")
      .inTable("authors");
    t.foreign("genre_id")
      .references("id")
      .inTable("genres");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("books");
};
