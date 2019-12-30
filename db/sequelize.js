const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// db.authors = require("../models/sequelize/author")(sequelize, Sequelize);
// db.tags = require("../models/sequelize/tag")(sequelize, Sequelize);
// db.books = require("../models/sequelize/book")(sequelize, Sequelize);
// db.tagBooks = require("../models/sequelize/tag_book")(sequelize, Sequelize);

// db.books.belongsTo(db.authors, { foreignKey: "author_id" });
// db.authors.hasMany(db.books);

// db.tags.belongsToMany(db.boojs, { through: 'tagBooks'});
// db.books.belongsToMany(db.tags, { through: "tagBooks"});

module.exports = db;
