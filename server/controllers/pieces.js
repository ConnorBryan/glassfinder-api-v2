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
  edit: (req, res) => {
    processify(req, res, async () => {
      const {
        params: { id },
        body: {
          title,
          price,
          description,
        },
      } = req;

      if (!id) {
        error(res, `A piece ID is required to edit`);
      }

      const piece = await Piece.findById(id);

      if (!piece) {
        error(res, `No piece with ID #${id} exists in the database`);
      }

      if (title)        piece.title = title;
      if (price)        piece.price = price;
      if (description)  piece.description = description;

      await piece.save();

      success(res, { piece });
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