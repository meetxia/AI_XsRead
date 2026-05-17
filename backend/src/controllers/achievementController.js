const Response = require('../utils/response');
const achievementService = require('../services/achievementService');

async function list(req, res, next) {
  try {
    const result = await achievementService.evaluate(req.user.id);
    return Response.success(res, result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list
};
