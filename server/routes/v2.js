const { Op } = require('sequelize');

const { processify, success, error } = require('../controllers/common');
const models = require('../models');

const DEFAULT_PAGE      = 0;
const DEFAULT_PER_PAGE  = 10;

module.exports = app => {
  Object
    .values(models)
    .forEach(Model => {
        try {
          const { options: { name: { singular, plural } } } = Model;

          // Create
          app.post(`/api/v2/${plural}`, (req, res) => createControl(req, res, Model));

          // Read
          app.get(`/api/v2/${singular}/:id`, (req, res) => readControl(req, res, Model));

          // Update
          app.post(`/api/v2/${singular}/:id`, (req, res) => updateControl(req, res, Model));

          // Destroy
          app.delete(`/api/v2/${singular}/:id`, (req, res) => destroyControl(req, res, Model));

          // List
          app.get(`/api/v2/${plural}`, (req, res) => listControl(req, res, Model));

        } catch (e) {
          // Pass
        }
    });

  app.post(`/api/v2/link-account`, (req, res) => linkControl(req, res));

  return app;
};

/* = = = */

function createControl(req, res, Model) {
  processify(req, res, async () => {
    const attributes = Object.assign({}, req.body);
    const model = await Model.create(attributes);

    return success(res, { model });
  });
}

function readControl(req, res, Model) {
  processify(req, res, async () => {
    const { id } = req.params;

    if (!id) {
      return error(res, `An ID is required for an individual lookup.`);
    }

    const model = await Model.findById(id);

    if (!model) {
      return error(res, `No model was found with ID ${id}.`);
    }

    return success(res, { model });
  });
}

function updateControl(req, res, Model) {
  processify(req, res, async () => {
    const { id } = req.params;
    const attributes = Object.assign({}, req.body);

    if (!id) {
      return error(res, `An ID is required for an individual update.`);
    }

    if (!Object.keys(attributes).length) {
      return error(res, `At least one field must change for an update.`);
    }

    const model = await Model.findById(id);

    if (!model) {
      return error(res, `No model was found with ID ${id}.`);
    }

    Object.keys(attributes).forEach(attribute => (model[attribute] = attributes[attribute]));

    await model.save();

    return success(res, { model });
  });
}

function destroyControl(req, res, Model) {
  processify(req, res, async () => {
    const { id } = req.params;

    if (!id) {
      return error(res, `An ID is required for an individual destroy.`);
    }

    const model = await Model.destroy({ where: { id } });

    return success(res, { model });
  });
}

function listControl(req, res, Model) {
  processify(req, res, async () => {
    const {
      ids,
      page = DEFAULT_PAGE,
      perPage = DEFAULT_PER_PAGE,
    } = req.query;
    const paginationStart = page * perPage;
    const paginationEnd = paginationStart + perPage;

    const models = await (
      ids
        ? Model.findAll({ where: { id: { [Op.or]: ids.split(',') } } })
        : Model.all()
    );

    const paginatedModels = models.slice(paginationStart, paginationEnd);
    const pageCount = Math.floor(models.length / perPage);

    return success(res, { models: paginatedModels, pageCount });
  });
}

function linkControl(req, res) {
  processify(req, res, async () => {
    const { body: { email, type, data } } = req;
    const requiredFields = {
      'shop': [
        'name',
        'description',
        'street',
        'city',
        'stateCode',
        'zip',
        'image',
        'email',
        'phone',
      ],
    };

    // All body parameters must be provided.
    if (!email) return error(res, `An email is required to link an account.`);
    if (!type) return error(res, `A type must be provided to link an account.`);
    if (!data) return error(res, `Data must be provided with which to link an account.`);
    
    // Should contain all required fields.
    const required = requiredFields[type];
    
    if (!required) return error(res, `An invalid type was specified.`);

    // Account shouldn't already be linked.
    const dbUser = await models.User.findOne({ where: { email } });

    if (dbUser.linked) return error(res, `Specified account was already linked.`);

    const attributes = required.reduce((acc, cur) => Object.assign(acc, { [cur]: data[cur] }), {});
    attributes.state = data.stateCode;
    attributes.type = type;
    attributes.linked = true;

    Object.keys(attributes).forEach(attribute => (dbUser[attribute] = attributes[attribute]));

    await dbUser.save();

    return success(res, { user: dbUser });
  });
}