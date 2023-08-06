var express = require('express');
var router = express.Router();
var gptController = require('../controllers/gpt.controller');
router.post('/getAnswer', (req, res) => {
  console.log('req.body', req.body);
  gptController
    .getAnswer(req)
    .then((data) => res.json(data))
    .catch((err) => res.send(err));
});
module.exports = router;
