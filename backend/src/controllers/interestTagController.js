const Response = require('../utils/response');
const interestTagService = require('../services/interestTagService');

async function list(req, res, next) {
  try {
    const tags = await interestTagService.listTags(req.user.id);
    return Response.success(res, tags);
  } catch (error) {
    if (error.httpStatus) return Response.error(res, error.message, error.httpStatus);
    return next(error);
  }
}

async function save(req, res, next) {
  try {
    const result = await interestTagService.saveTags(req.user.id, req.body.tags);
    return Response.success(res, result, '保存成功');
  } catch (error) {
    if (error.httpStatus) return Response.error(res, error.message, error.httpStatus);
    return next(error);
  }
}

module.exports = {
  list,
  save
};
