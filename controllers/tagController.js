const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const sequelize = require("../db/sequelize");

exports.tag_list = async function(req, res, next) {
  try {
    const tags = await knex("tags").select("*");
    const tag_list = [...tags];
    res.render("tag_list", { title: "Tag List", tag_list });
  } catch (e) {
    next(e);
  }
};

exports.tag_detail = async function(req, res, next) {
  const isValidId = /^\d+$/.test(req.params.id);
  if (isValidId) {
    try {
      const tagRes = await knex("tags")
        .select("*")
        .where("id", "=", req.params.id);
      const tagBooksRes = await knex.raw(
        "SELECT tags.name, books.title, books.summary, books.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE tags.id = ?",
        req.params.id
      );
      const tag_books = [...tagBooksRes.rows];
      const tag = tagRes[0];
      res.render("tag_detail", { title: "Tag Detail", tag, tag_books });
    } catch (e) {
      next(e);
    }
  } else {
    res.render("tag_form", { title: "Create Tag" });
  }
};

exports.tag_create_get = async function(req, res, next) {
  res.render("tag_form", { title: "Create Tag" });
};

exports.tag_create_post = [
  body("name", "Tag name required")
    .isLength({ min: 1 })
    .trim(),
  sanitizeBody("name")
    .trim()
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("tag_form", { title: "Create Tag", errors: errors.array() });
    } else {
      try {
        const result = await knex.raw("INSERT INTO tags (name) values(?) RETURNING id", req.body.name);
        const { id } = result.rows[0];
        res.redirect(id);
      } catch (e) {
        console.log(e);
        next(e);
      }
    }
  }
];

exports.tag_delete_get = async function(req, res, next) {
  try {
    const tagRes = await knex("tags")
      .select("*")
      .where("id", "=", req.params.id);
    const tagBooks = await knex.raw(
      "SELECT books.title, books.summary, books.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE tags.id = ?",
      req.params.id
    );
    const tag = tagRes[0];
    const tags_books = [...tagBooks.rows];
    res.render("tag_delete", { title: "Delete Tag", tag, tags_books });
  } catch (e) {
    next(e);
  }
};

exports.tag_delete_post = async function(req, res, next) {
  try {
    const tagRes = await knex("tags")
      .select("*")
      .where("id", req.body.tagid);
    const tagsBookRes = await knex.raw(
      "SELECT books.title, books.summary, books.id FROM tags JOIN tags_books ON tags.id = tags_books.tag_id JOIN books ON books.id = tags_books.book_id WHERE tags.id = ?",
      req.body.tagid
    );
    const tag = tagRes[0];
    const tagsBooks = [...tagsBookRes.rows];

    if (tagsBooks.length > 0) {
      res.render("tag_delete", { title: "Delete Tag", tag, tags_books: tagsBooks });
    } else {
      await knex("tags")
        .where("id", req.body.tagid)
        .del();
      res.redirect("/catalog/tags");
    }
  } catch (e) {
    next(e);
  }
};

exports.tag_update_get = async function(req, res, next) {
  try {
    const tagRes = await knex("tags")
      .select("*")
      .where("id", req.params.id);
    const tag = tagRes[0];
    res.render("tag_form", { title: "Update Tag", tag });
  } catch (e) {
    next(e);
  }
};

exports.tag_update_post = [
  body("name", "Tag name required")
    .isLength({ min: 1 })
    .trim(),
  sanitizeBody("name")
    .trim()
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("tag_form", { title: "Update Tag", errors: errors.array() });
    } else {
      try {
        const result = await knex("tags")
          .where("id", req.params.id)
          .update({
            name: req.body.name
          })
          .returning("id");
        const id = result[0];
        res.redirect(`/catalog/tag/${id}`);
      } catch (e) {
        next(e);
      }
    }
  }
];
