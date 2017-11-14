const { processify, success, error } = require('../controllers/common');
const models = require('../models');

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
    const models = await Model.all();

    return success(res, { models });
  });
}