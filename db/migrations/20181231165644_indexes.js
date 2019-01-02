exports.up = function(knex, Promise) {
  return knex.schema.alterTable("bookinstances", t => {
    t.index("status", "status_idx");
    t.index("book_id", "book_id_idx");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("bookinstances");
};
