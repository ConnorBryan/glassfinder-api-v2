const { processify, success, error } = require('./common');

const { Shop, Piece } = require('../models');

module.exports = {
  get: (req, res) => {
    processify(req, res, async () => {
      const { params: { id } } = req;

      if (!id) {
        return error(res, `An ID must be specified when requesting an individual user`);
      }

      const shop = await Shop.findById(parseInt(id));

      if (!shop) {
        return error(res, `No shop was found with ID ${id}`);
      }

      const { userId } = shop;

      const pieces = await Piece.findAll({ where: { userId } }).map(({ id }) => id);

      success(res, { shop, pieces });
    });
  },
  list: (req, res) => {
    processify(req, res, async () => {
      const { query: { ids } } = req;

      if (ids) {
        const idsToFetch = ids.split(',');
        const shops = await Shop.findAll({
          where: {
            id: {
              [Op.or]: idsToFetch,
            },
          },
        });

        success(res, { shops });
      } else {
        const shops = await Shop.all();

        success(res, { shops });
      }
    });
  },
};