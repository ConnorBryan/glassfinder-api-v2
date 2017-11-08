module.exports = { processify, success, error };

/* = = = */

async function processify(req, res, process) {
  try {
    await process();
  } catch (e) {
    return error(res, e.message);
  }
}

function success(res, data) {
  return res.json(Object.assign({ success: true }, data));
}

function error(res, message) {
  return res.json({ success: false, message });
}
