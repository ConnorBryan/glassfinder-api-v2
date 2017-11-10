const { Op } = require('sequelize');

const { processify, success, error } = require('./common');

const { Piece } = require('../models');

module.exports = {
  list: (req, res) => {
    processify(req, res, async () => {
      const { query: { ids } } = req;

      if (ids) {
        const idsToFetch = ids.split(',');
        const pieces = await Piece.findAll({
          where: {
            id: {
              [Op.or]: idsToFetch,
            },
          },
        });

        success(res, { pieces });
      } else {
        const pieces = await Piece.all();

        success(res, { pieces });
      }
    });
  },
};