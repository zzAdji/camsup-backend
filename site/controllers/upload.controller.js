const UserModel = require('../models/user.model');
const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const { uploadErrors } = require('../utils/errors.utils');

module.exports.uploadProfil = async (req, res) => {
  try {
    if (
      req.file.detectedMimeType != 'image/jpg' &&
      req.file.detectedMimeType != 'image/png' &&
      req.file.detectedMimeType != 'image/jpeg'
    )
      throw Error('invalid file');

    if (req.file.size > 500000) throw Error('max size');

    const fileName = req.body.name + '.jpg';

    // Mettre à jour la base de données avec le nouveau chemin de l'image
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.body.userId,
        { $set: { picture: '/uploads/profil/' + fileName } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      if (!updatedUser) throw Error('User not found');
    } catch (err) {
      throw Error('Failed to update user picture in the database');
    }

    // Ensuite, écrire le fichier sur le disque
    await pipeline(
      req.file.stream,
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/profil/${fileName}`
      )
    );

    return res.status(200).json({ message: 'File uploaded successfully' });
  } catch (err) {
    const errors = uploadErrors(err);
    return res.status(500).json({ errors });
  }
};
