const { processify, success, error } = require('./common');

const { Piece } = require('../models');

module.exports = {
  list: (req, res) => {
    processify(req, res, async () => {
      const pieces = await Piece.all();

      success(res, { pieces });
    });
  },
};