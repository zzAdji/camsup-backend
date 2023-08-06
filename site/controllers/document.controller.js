const documentModel = require('../models/document.model');
const DocumentModel = require('../models/document.model');
const ObjectID = require('mongoose').Types.ObjectId;
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const UserModel = require('../models/user.model');
const pipeline = promisify(require('stream').pipeline);

module.exports.readDocument = async (req, res) => {
  try {
    const documents = await documentModel.find().sort({ _id: -1 }).exec();
    res.send(documents);
  } catch (err) {
    console.log('Erreur lors de la récupération des documents : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.createDocument = async (req, res) => {
  let fileName;

  if (req.file !== undefined) {
    try {
      if (
        req.file.detectedMimeType != 'application/pdf' &&
        req.file.detectedMimeType !=
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
        throw new Error('Invalid file type');

      if (req.file.size > 5000000)
        throw new Error('File size exceeds the limit (5MB).');
    } catch (err) {
      return res.status(400).json({ error: err.message }); // Return the specific error message
    }

    if (req.file.detectedMimeType == 'application/pdf')
      fileName = req.body.documenterId + Date.now() + '.pdf';
    if (
      req.file.detectedMimeType ==
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      fileName = req.body.documenterId + Date.now() + '.docx';

    await pipeline(
      req.file.stream,
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/documents/${fileName}`
      )
    );
  }

  const newDocument = new DocumentModel({
    // Use the variable name "DocumentModel" instead of "documentModel"
    documenterId: req.body.documenterId,
    title: req.body.title,
    tags: req.body.tags,
    picture: req.file !== undefined ? '/uploads/documents/default-pdf.png' : '',
    faxe: req.file !== undefined ? '/uploads/documents/' + fileName : '',
    signeters: [],
    downloaders: [],
  });

  try {
    const document = await newDocument.save();
    return res.status(201).json(document);
  } catch (err) {
    return res.status(400).json({ error: err.message }); // Return the specific error message
  }
};

module.exports.deleteDocument = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);

  try {
    const deletedDocument = await documentModel
      .findByIdAndRemove(req.params.id)
      .exec();

    if (!deletedDocument) {
      return res.status(404).send('Document non trouvé');
    }

    res.send(deletedDocument);
  } catch (err) {
    console.log('Erreur lors de la suppression du document : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.signetDocument = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);
  try {
    const updatedDocument = await documentModel
      .findByIdAndUpdate(
        req.params.id,
        { $addToSet: { signeters: req.body.id } },
        { new: true }
      )
      .exec();

    if (!updatedDocument) {
      return res.status(404).send('Document non trouvé');
    }

    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $addToSet: { signets: req.body.id } },
      { new: true }
    ).exec();

    res.send(updatedDocument);
  } catch (err) {
    console.log("Erreur lors de l'ajout du document aux favoris : " + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.unsignetDocument = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);
  try {
    const updatedDocument = await documentModel
      .findByIdAndUpdate(
        req.params.id,
        { $pull: { signeters: req.body.id } },
        { new: true }
      )
      .exec();

    if (!updatedDocument) {
      return res.status(404).send('Document non trouvé');
    }

    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $pull: { signets: req.body.id } },
      { new: true }
    ).exec();

    res.send(updatedDocument);
  } catch (err) {
    console.log(
      'Erreur lors de la suppression du document des favoris : ' + err
    );
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.downloadDocument = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);
  try {
    const updatedDocument = await documentModel
      .findByIdAndUpdate(
        req.params.id,
        { $addToSet: { downloaders: req.body.id } },
        { new: true }
      )
      .exec();

    if (!updatedDocument) {
      return res.status(404).send('Document non trouvé');
    }

    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $addToSet: { downloads: req.body.id } },
      { new: true }
    ).exec();

    res.send(updatedDocument);
  } catch (err) {
    console.log('Erreur lors du téléchargement du document : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
