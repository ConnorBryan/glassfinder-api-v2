const { Op } = require('sequelize');

const { Piece }                       = require('../models');
const { processify, success, error }  = require('./common');

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