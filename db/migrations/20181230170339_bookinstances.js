exports.up = function(knex, Promise) {
  return knex.schema.createTable("bookinstances", t => {
    t.increments("id").primary();
    t.enum("status", ["Maintenance", "Available", "Loaned", "Reserved"]);
    t.string("imprint");
    t.date("due_date");
    t.integer("book_id").notNullable();
    t.foreign("book_id")
      .references("id")
      .inTable("books");
    t.index("status", "status_idx");
    t.index("book_id", "book_id_idx");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("bookinstances");
};
