const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

exports.index = function(req, res) {
  async.parallel(
    {
      book_count(cb) {
        Book.countDocuments({}, cb);
      },
      book_instance_count(cb) {
        BookInstance.countDocuments({}, cb);
      },
      book_instance_available_count(cb) {
        BookInstance.countDocuments({ status: "Available" }, cb);
      },
      author_count(cb) {
        Author.countDocuments({}, cb);
      },
      genre_count(cb) {
        Genre.countDocuments({}, cb);
      }
    },
    (err, results) => {
      res.render("index", { title: "Local Library Home", error: err, data: results });
    }
  );
};

// Display list of all books.
exports.book_list = function(req, res, next) {
  Book.find({}, "title author")
    .populate("author")
    .exec((err, list_books) => {
      if (err) {
        return next(err);
      }
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
  async.parallel(
    {
      book(cb) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(cb);
      },
      book_instance(cb) {
        BookInstance.find({ book: req.params.id }).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.book) {
        const e = new Error("Book not found");
        e.status = 404;
        return next(e);
      }
      res.render("book_detail", { title: "Title", book: results.book, book_instances: results.book_instance });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
  async.parallel(
    {
      authors(cb) {
        Author.find(cb);
      },
      genres(cb) {
        Genre.find(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("book_form", { title: "Create Book", authors: results.authors, genres: results.genres });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
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
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(cb) {
            Author.find(cb);
          },
          genres(cb) {
            Genre.find(cb);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }
          for (let i = 0; i < results.genres.length; i += 1) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array()
          });
        }
      );
    } else {
      book.save(e => {
        if (e) {
          return next(e);
        }
        res.redirect(book.url);
      });
    }
  }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
  async.parallel(
    {
      book(cb) {
        Book.findById(req.params.id).exec(cb);
      },
      bookinstances(cb) {
        BookInstance.find({ book: req.params.id }).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.book) {
        res.redirect("/catalog/books");
      }
      res.render("book_delete", { title: "Delete Book", book: results.book, bookinstances: results.bookinstances });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
  async.parallel(
    {
      book(cb) {
        Book.findById(req.body.bookid).exec(cb);
      },
      bookinstances(cb) {
        BookInstance.find({ book: req.body.bodyid }).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstances.length > 0) {
        res.render("book_delete", { title: "Delete Book", book: results.book, bookinstances: results.bookinstances });
      } else {
        Book.findByIdAndRemove(req.body.bookid, e => {
          if (e) {
            return next(e);
          }
          res.redirect("/catalog/books");
        });
      }
    }
  );
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
  async.parallel(
    {
      book(cb) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(cb);
      },
      authors(cb) {
        Author.find(cb);
      },
      genres(cb) {
        Genre.find(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.book) {
        const e = new Error("Book not found");
        e.status = 404;
        return next(e);
      }
      for (let gIter = 0; gIter < results.genres.length; gIter += 1) {
        for (let bIter = 0; bIter < results.book.genre.length; bIter += 1) {
          if (results.genres[gIter]._id.toString() == results.book.genre[bIter]._id.toString()) {
            results.genres[gIter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  (req, rest, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
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
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(cb) {
            Author.find(cb);
          },
          genres(cb) {
            Genre.find(cb);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }
          for (let i = 0; i < results.genres.length; i += 1) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array()
          });
        }
      );
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, (e, theBook) => {
        if (e) {
          return next(e);
        }
        res.redirect(theBook.url);
      });
    }
  }
];
