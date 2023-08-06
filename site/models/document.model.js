const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    documenterId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      maxlength: 50,
      required: true,
      trim: true,
    },
    tags: {
      type: String,
    },
    picture: {
      type: String,
    },
    faxe: {
      type: String,
    },
    signeters: {
      type: [String],
      required: true,
    },
    downloaders: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('document', DocumentSchema);
