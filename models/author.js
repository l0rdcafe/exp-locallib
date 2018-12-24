const mongoose = require("mongoose");

const { Schema } = mongoose;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date }
});

AuthorSchema.virtual("name").get(function() {
  return `${this.family_name}, ${this.first_name}`;
});

AuthorSchema.virtual("lifespan").get(function() {
  return this.date_of_death && this.date_of_birth && (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

AuthorSchema.virtual("url").get(function() {
  return `/catalog/author/${this._id}`;
});

module.exports = mongoose.model("Author", AuthorSchema);
