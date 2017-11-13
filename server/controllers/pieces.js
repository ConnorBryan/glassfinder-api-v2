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
  delete: (req, res) => {
    processify(req, res, async () => {
      const { params: { id } } = req;

      if (!id) {
        error(res, `A piece ID is required for deletion`);
      }

      const piece = await Piece.destroy({ where: { id } });

      if (!piece) {
        error(res, `No piece was harmed during the making of this film`);
      }

      success(res, { piece });
    });
  },
};