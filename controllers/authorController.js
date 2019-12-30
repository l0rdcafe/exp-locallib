const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const db = require("../db/sequelize");

// Display list of all Authors.
exports.author_list = async function(req, res, next) {
  try {
    const list_authors = await db.authors.findAll({ raw: true });
    console.log(list_authors);
    res.render("author_list", { title: "Author List", author_list: list_authors });
  } catch (e) {
    next(e);
  }
};

// Display detail page for a specific Author.
exports.author_detail = async function(req, res, next) {
  try {
   const author = await db.authors.findById(req.params.id);
   const authors_books = await db.books.findAll({ where: {author_id: req.params.id}, raw: true})
   console.log(author, authors_books);
   res.render("author_detail", { title: "Author Detail", author, authors_books });
  } catch (e) {
    next(e);
  }
};

// Display Author create form on GET.
exports.author_create_get = function(req, res, next) {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601(),
  sanitizeBody("first_name")
    .trim()
    .escape(),
  sanitizeBody("family_name")
    .trim()
    .escape(),
  sanitizeBody("date_of_birth").toDate(),
  sanitizeBody("date_of_death").toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("author_form", { title: "Create Author", author: req.body, errors: errors.array() });
    } else {
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body_date_of_death
      });
      author.save(e => {
        if (e) {
          return next(e);
        }
        res.redirect(author.url);
      });
    }
  }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
  async.parallel(
    {
      author(cb) {
        Author.findById(req.params.id).exec(cb);
      },
      authors_books(cb) {
        Book.find({ author: req.params.id }).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.author) {
        res.redirect("/catalog/authors");
      }
      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        author_books: results.authors_books
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
  async.parallel(
    {
      author(cb) {
        Author.findById(req.body.authorid).exec(cb);
      },
      authors_books(cb) {
        Book.find({ author: req.body.authorid }).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.authors_books.length > 0) {
        res.render("author_delete", {
          title: "Delete Author",
          author: results.author,
          author_books: results.authors_books
        });
      } else {
        Author.findByIdAndRemove(req.body.authorid, e => {
          if (e) {
            return next(e);
          }
          res.redirect("/catalog/authors");
        });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
  Author.findById(req.params.id, (err, author) => {
    if (err) {
      return next(err);
    }
    if (!author) {
      const e = new Error("Author not found");
      e.status = 404;
      return next(e);
    }
    res.render("author_form", { title: "Update Author", author });
  });
};

// Handle Author update on POST.
exports.author_update_post = [
  body("first_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601(),
  sanitizeBody("first_name")
    .trim()
    .escape(),
  sanitizeBody("family_name")
    .trim()
    .escape(),
  sanitizeBody("date_of_birth").toDate(),
  sanitizeBody("date_of_death").toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      res.render("author_form", { title: "Update Author", author, errors: errors.array() });
      return undefined;
    }
    Author.findByIdAndUpdate(req.params.id, author, {}, (err, theAuthor) => {
      if (err) {
        return next(err);
      }
      res.redirect(theAuthor.url);
    });
  }
];
