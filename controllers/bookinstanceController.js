const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const async = require("async");
const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_list", { title: "Book Instance List", bookinstance_list: list_bookinstances });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (!bookinstance) {
        const e = new Error("Book copy not found");
        e.status = 404;
        return next(err);
      }
      res.render("bookinstance_detail", { title: "Book", bookinstance });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    res.render("bookinstance_form", { title: "Create BookInstance", book_list: books });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Books must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("imprint", "Imprint must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601(),
  sanitizeBody("book")
    .trim()
    .escape(),
  sanitizeBody("imprint")
    .trim()
    .escape(),
  sanitizeBody("status")
    .trim()
    .escape(),
  sanitizeBody("due_back").toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance
        });
      });
    } else {
      bookinstance.save(e => {
        if (e) {
          return next(e);
        }
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  async.parallel(
    {
      instance(cb) {
        BookInstance.findById(req.params.id).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.instance) {
        res.redirect("/catalog/bookinstances");
      }
      res.render("bookinstance_delete", { title: "Delete Book Instance", bookinstance: results.instance });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
  async.parallel(
    {
      instance(cb) {
        BookInstance.findById(req.body.bookinstanceid).exec(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, e => {
        if (e) {
          return next(e);
        }
        res.redirect("/catalog/bookinstances");
      });
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
  async.parallel(
    {
      bookinstance(cb) {
        BookInstance.findById(req.params.id)
          .populate("book")
          .exec(cb);
      },
      books(cb) {
        Book.find(cb);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (!results.bookinstance) {
        const e = new Error("Book instance not found");
        e.status = 404;
        return next(e);
      }
      res.render("bookinstance_form", {
        title: "Update Book Instance",
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("imprint", "Imprint must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601(),
  sanitizeBody("book")
    .trim()
    .escape(),
  sanitizeBody("imprint")
    .trim()
    .escape(),
  sanitizeBody("status")
    .trim()
    .escape(),
  sanitizeBody("due_back").toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Update Book Instance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance
        });
      });
      return undefined;
    }
    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (e, instance) => {
      if (e) {
        return next(e);
      }
      res.redirect(instance.url);
    });
  }
];
