const postModel = require('../models/post.model');
const PostModel = require('../models/post.model');
const UserModel = require('../models/user.model');
const { uploadErrors } = require('../utils/errors.utils');
const ObjectID = require('mongoose').Types.ObjectId;
const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

module.exports.readPost = async (req, res) => {
  try {
    const posts = await postModel.find().sort({ _id: -1 }).exec();
    res.send(posts);
  } catch (err) {
    console.log('Erreur lors de la récupération des publications : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.createPost = async (req, res) => {
  let fileName;

  if (req.file !== null) {
    try {
      if (
        req.file.detectedMimeType != 'image/jpg' &&
        req.file.detectedMimeType != 'image/png' &&
        req.file.detectedMimeType != 'image/jpeg'
      )
        throw Error('invalid file');

      if (req.file.size > 500000) throw Error('max size');
    } catch (err) {
      const errors = uploadErrors(err);
      return res.status(201).json({ errors });
    }
    fileName = req.body.posterId + Date.now() + '.jpg';

    await pipeline(
      req.file.stream,
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/posts/${fileName}`
      )
    );
  }
  const newPost = new postModel({
    posterId: req.body.posterId,
    message: req.body.message,
    picture: req.file !== null ? '/uploads/posts/' + fileName : '',
    video: req.body.video,
    likers: [],
    comments: [],
  });

  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.updatePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);

  const updatedRecord = {
    message: req.body.message,
  };

  try {
    const updatedPost = await postModel
      .findByIdAndUpdate(req.params.id, { $set: updatedRecord }, { new: true })
      .exec();

    if (!updatedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    res.send(updatedPost);
  } catch (err) {
    console.log('Erreur lors de la mise à jour de la publication : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.deletePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);

  try {
    const deletedPost = await postModel.findByIdAndRemove(req.params.id).exec();

    if (!deletedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    res.send(deletedPost);
  } catch (err) {
    console.log('Erreur lors de la suppression de la publication : ' + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.likePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);

  try {
    const updatedPost = await postModel
      .findByIdAndUpdate(
        req.params.id,
        { $addToSet: { likers: req.body.id } },
        { new: true }
      )
      .exec();

    if (!updatedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $addToSet: { likes: req.params.id } },
      { new: true }
    ).exec();

    res.send(updatedPost);
  } catch (err) {
    console.log("Erreur lors de l'ajout du like à la publication : " + err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID inconnu : ' + req.params.id);

  try {
    const updatedPost = await postModel
      .findByIdAndUpdate(
        req.params.id,
        { $pull: { likers: req.body.id } },
        { new: true }
      )
      .exec();

    if (!updatedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $pull: { likes: req.params.id } },
      { new: true }
    ).exec();

    res.send(updatedPost);
  } catch (err) {
    console.log(
      'Erreur lors de la suppression du like de la publication : ' + err
    );
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.commentPost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID unknown : ' + req.params.id);

  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true }
    ).exec();

    if (!updatedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    res.send(updatedPost);
  } catch (err) {
    console.log(
      "Erreur lors de l'ajout du commentaire à la publication : " + err
    );
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports.editCommentPost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID unknown : ' + req.params.id);

  try {
    const post = await PostModel.findById(req.params.id).exec();
    const theComment = post.comments.find((comment) =>
      comment._id.equals(req.body.commentId)
    );

    if (!theComment) return res.status(404).send('Comment not found');
    theComment.text = req.body.text;

    const updatedPost = await post.save();

    return res.status(200).send(updatedPost);
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.deleteCommentPost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('ID unknown : ' + req.params.id);

  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId,
          },
        },
      },
      { new: true }
    ).exec();

    if (!updatedPost) {
      return res.status(404).send('Publication non trouvée');
    }

    res.send(updatedPost);
  } catch (err) {
    return res.status(400).send(err);
  }
};
