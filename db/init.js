const db = require("./sequelize");

(async () => {
  await db.authors.bulkCreate([
    {
      first_name: "Patrick",
      last_name: "Rothfuss",
      date_of_birth: "1973-06-05",
      date_of_death: null
    },
    { first_name: "Ben", last_name: "Bova", date_of_birth: "1932-11-08", date_of_death: null },
    { first_name: "Bob", last_name: "Billing", date_of_birth: null, date_of_death: null },
    { first_name: "Isaac", last_name: "Asimov", date_of_birth: "1920-01-01", date_of_death: "1992-04-05" }
  ]);

  await db.tags.bulkCreate([{ name: "sad" }, { name: "thriller" }, { name: "funny" }, { name: "exciting" }]);

  await db.books.bulkCreate([
    { title: "The name of nice", summary: "I am wearing it", isbn: 12309802196, author_id: 1 },
    { title: "Truth", summary: "I am wearing it", isbn: 298302918, author_id: 1 },
    { title: "Jacket", summary: "I am wearing it", isbn: 29809480982398, author_id: 1 },
    { title: "Apes and Angels", summary: "I am wearing it", isbn: 8647302, author_id: 2 },
    { title: "Play", summary: "I am wearing it", isbn: 8302817, author_id: 3 },
    { title: "Plug", summary: "I am wearing it", isbn: 56798932, author_id: 4 }
  ]);

  await db.tagBooks.bulkCreate([
    { tag_id: 1, book_id: 3 },
    { tag_id: 1, book_id: 2 },
    { tag_id: 2, book_id: 1 },
    { tag_id: 4, book_id: 1 },
    { tag_id: 3, book_id: 4 }
  ]);
})();
