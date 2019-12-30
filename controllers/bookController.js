const { promisify } = require("util");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

const knex = require("../db/knex_instance");
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const redis = require("../db/redis");

exports.index = async function(req, res) {
  try {
    const bookCount = await knex("books").count("*");
    const bookinstanceCount = await knex("bookinstances").count("*");
    const bookinstanceAvailableCount = await knex("bookinstances")
      .count("*")
      .where("status", "=", "Available");
    const authorCount = await knex("authors").count("*");
    const genreCount = await knex("genres").count("*");
    const tagCount = await knex("tags").count("*");

    const { count: book_count } = bookCount[0];
    const { count: book_instance_count } = bookinstanceCount[0];
    const { count: book_instance_available_count } = bookinstanceAvailableCount[0];
    const { count: author_count } = authorCount[0];
    const { count: genre_count } = genreCount[0];
    const { count: tag_count } = tagCount[0];
    const user_countRes = redis.incr("count");
    let user_count;

    if (user_countRes) {
      const getAsync = promisify(redis.get).bind(redis);
      user_count = await getAsync("count");
    } else {
      user_count = 1;
    }

    const data = {
      book_count,
      book_instance_count,
      book_instance_available_count,
      author_count,
      genre_count,
      user_count,
      tag_count
    };
    res.render("index", { title: "Local Library Home", data });
  } catch (e) {
    console.log(e);
    res.render("index", { title: "Local Library Home", error: e });
  }
};

// Display list of all books.
exports.book_list = async function(req, res, next) {
  try {
    const bookList = await knex("books")
      .join("authors", "books.author_id", "authors.id")
      .select(
        "books.id",
        "books.title",
        "authors.first_name as author_first_name",
        "authors.family_name as author_family_name",
        "books.author_id"
      );
    const book_list = [...bookList];
    res.render("book_list", { title: "Book List", book_list });
  } catch (e) {
    console.log(e);
    next(e);
    res.render("book_list", { title: "Book List", error: e });
  }
};

// Display detail page for a specific book.
exports.book_detail = async function(req, res, next) {
  try {
    const bookResult = await knex("books")
      .where("books.id", req.params.id)
      .join("authors", "books.author_id", "authors.id")
      .join("genres", "books.genre_id", "genres.id")
      .select(
        "books.id as book_id",
        "books.title",
        "books.summary",
        "books.isbn",
        "genres.name as genre",
        "authors.first_name as author_first_name",
        "authors.family_name as author_family_name",
        "authors.id as author_id"
      );
    const bookinstanceResult = await knex("bookinstances")
      .where("book_id", req.params.id)
      .select("status", "id as instance_id", "due_date", "imprint");
    const tagsResult = await knex.raw(
      "SELECT tags.name FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE books.id = ?",
      req.params.id
    );
    const tags = [...tagsResult.rows].map(i => i.name);
    const book = bookResult[0];
    const book_instances = [...bookinstanceResult];
    res.render("book_detail", { title: "Title", book, book_instances, tags });
  } catch (e) {
    console.log(e);
    next(e);
    res.render("book_detail", { title: "Title", error: e });
  }
};

// Display book create form on GET.
exports.book_create_get = async function(req, res, next) {
  try {
    const authorsResult = await knex("authors").select("family_name", "first_name", "id");
    const genresResult = await knex("genres").select("name", "id");
    const tagsResult = await knex("tags").select("*");
    const authors = [...authorsResult];
    const genres = [...genresResult];
    const tags = [...tagsResult];
    res.render("book_form", { title: "Create Book", authors, genres, tags });
  } catch (e) {
    console.log(e);
    next(e);
    res.render("book_form", { title: "Create Book", error: e });
  }
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.tag instanceof Array)) {
      if (typeof req.body.tag === "undefined") {
        req.body.tag = [];
      } else {
        req.body.tag = new Array(req.body.tag);
      }
    }
    next();
  },
  body("title", "Title must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("author", "Author must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("summary", "Summary must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("isbn", "ISBN must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  sanitizeBody("*")
    .trim()
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      try {
        const authorsResult = await knex("authors").select("first_name", "family_name", "id");
        const genresResult = await knex("genres").select("name", "id");
        const tagsResult = await knex("tags").select("*");
        const genres = [...genresResult];
        const authors = [...authorsResult];
        const tags = [...tagsResult];
        res.render("book_form", { title: "Create Book", authors, genres, tags });
      } catch (e) {
        console.log(e);
        res.render("book_form", { title: "Create Book", errors: errors.array() });
      }
    } else {
      try {
        const id = await knex("books")
          .insert({
            title: req.body.title,
            isbn: req.body.isbn,
            summary: req.body.summary,
            author_id: Number(req.body.author),
            genre_id: Number(req.body.genre)
          })
          .returning("id");
        const tagsResult = await knex("tags").select("*");
        const tags = [...tagsResult];
        req.body.tag = req.body.tag.map(n => parseInt(n, 10));
        for (let i = 0; i < tags.length; i += 1) {
          if (req.body.tag.indexOf(tags[i].id) > -1) {
            tags[i].checked = "true";
            await knex("tags_books").insert({
              book_id: id[0],
              tag_id: tags[i].id
            });
          }
        }
        res.redirect(`/catalog/book/${id}`);
      } catch (e) {
        next(e);
      }
    }
  }
];

// Display book delete form on GET.
exports.book_delete_get = async function(req, res, next) {
  try {
    const bookResult = await knex("books")
      .where("id", req.params.id)
      .select("id", "title");
    const bookinstancesResult = await knex("bookinstances")
      .where("book_id", req.params.id)
      .select("status", "id", "imprint");
    const book = bookResult[0];
    const bookinstances = [...bookinstancesResult];
    res.render("book_delete", { title: "Delete Book", book, bookinstances });
  } catch (e) {
    next(e);
    res.render("book_delete", { title: "Delete Book", error: e });
  }
};

// Handle book delete on POST.
exports.book_delete_post = async function(req, res, next) {
  try {
    const bookResult = await knex("books")
      .where("id", req.body.bookid)
      .select("id", "title");
    const bookinstancesResult = await knex("bookinstances")
      .where("book_id", req.body.bookid)
      .select("status", "imprint", "id");
    const bookinstances = [...bookinstancesResult];
    const book = bookResult[0];

    if (bookinstances.length > 0) {
      res.render("book_delete", { title: "Delete Book", book, bookinstances });
    } else {
      await knex("tags_books")
        .where("book_id", req.body.bookid)
        .del();
      await knex("books")
        .where("id", req.body.bookid)
        .del();
      res.redirect("/catalog/books");
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// Display book update form on GET.
exports.book_update_get = async function(req, res, next) {
  try {
    const bookResult = await knex("books")
      .where("books.id", req.params.id)
      .join("genres", "books.genre_id", "genres.id")
      .select("books.title", "books.summary", "books.isbn", "books.author_id", "genres.name as genre");
    const authorsResult = await knex("authors").select("first_name", "family_name", "id");
    const genresResult = await knex("genres").select("name", "id");
    const tagsResult = await knex.raw(
      "SELECT tags.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE books.id = ?",
      req.params.id
    );
    const allTags = await knex("tags").select("*");
    const checkedTags = [...tagsResult.rows].map(tag => tag.id);
    for (let i = 0; i < allTags.length; i += 1) {
      if (checkedTags.indexOf(allTags[i].id) > -1) {
        allTags[i].checked = "true";
      }
    }
    const authors = [...authorsResult];
    const genres = [...genresResult];
    const book = bookResult[0];
    const tags = [...allTags];
    res.render("book_form", { title: "Update Book", authors, book, genres, tags });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.tag instanceof Array)) {
      if (typeof req.body.tag === "undefined") {
        req.body.tag = [];
      } else {
        req.body.tag = new Array(req.body.tag);
      }
    }
    next();
  },
  body("title", "Title must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("author", "Author must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("summary", "Summary must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("isbn", "ISBN must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  sanitizeBody("title")
    .trim()
    .escape(),
  sanitizeBody("author")
    .trim()
    .escape(),
  sanitizeBody("summary")
    .trim()
    .escape(),
  sanitizeBody("isbn")
    .trim()
    .escape(),
  sanitizeBody("genre.*")
    .trim()
    .escape(),
  sanitizeBody("tag.*")
    .trim()
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    console.log("zobry");

    if (!errors.isEmpty()) {
      try {
        const authorsResult = await knex("authors").select("first_name", "family_name", "id");
        const genresResult = await knex("genres").select("name", "id");
        const authors = [...authorsResult];
        const genres = [...genresResult];

        const tagsResult = await knex.raw(
          "SELECT tags.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE books.id = ?",
          req.params.id
        );
        const allTags = await knex("tags").select("*");
        const checkedTags = [...tagsResult.rows].map(tag => tag.id);
        for (let i = 0; i < allTags.length; i += 1) {
          if (checkedTags.indexOf(allTags[i].id) > -1) {
            allTags[i].checked = "true";
          }
        }
        const tags = [...allTags];
        res.render("book_form", { title: "Update Book", authors, genres, tags });
      } catch (e) {
        next(e);
        res.render("book_form", { title: "Update Book", errors: errors.array() });
      }
    } else {
      try {
        const checkedTagsResult = await knex.raw(
          "SELECT tags.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE books.id = ?",
          req.params.id
        );
        const checkedTags = [...checkedTagsResult.rows].map(tag => tag.id);
        req.body.tag = req.body.tag.map(id => parseInt(id, 10));

        for (let i = 0; i < checkedTags.length; i += 1) {
          if (req.body.tag.indexOf(checkedTags[i]) < 0) {
            await knex("tags_books")
              .where("book_id", req.params.id)
              .andWhere("tag_id", checkedTags[i])
              .del();
          }
        }

        req.body.tag.forEach(async id => {
          if (checkedTags.indexOf(id) < 0) {
            await knex("tags_books")
              .insert({ book_id: req.params.id, tag_id: id })
              .whereNotExists("tag_id", id);
          }
        });

        await knex("books")
          .where("id", req.params.id)
          .update({
            title: req.body.title,
            author_id: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre_id: req.body.genre
          });

        res.redirect(`/catalog/book/${req.params.id}`);
      } catch (e) {
        next(e);
      }
    }
  }
];
