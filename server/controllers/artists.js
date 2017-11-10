const { processify, success, error } = require('./common');

const { Artist, Piece } = require('../models');

module.exports = {
  get: (req, res) => {
    processify(req, res, async () => {
      const { params: { id } } = req;

      if (!id) {
        return error(res, `An ID must be specified when requesting an individual user`);
      }

      const artist = await Artist.findById(parseInt(id));

      if (!artist) {
        return error(res, `No artist was found with ID ${id}`);
      }

      const { userId } = artist;

      const pieces = await Piece.findAll({ where: { userId } }).map(({ id }) => id);

      success(res, { artist, pieces });
    });
  },
};