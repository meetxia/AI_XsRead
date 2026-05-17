const Response = require('../utils/response');
const paragraphCommentService = require('../services/paragraphCommentService');

function knownError(res, error) {
  if (error.httpStatus) {
    return Response.error(res, error.message, error.httpStatus);
  }
  if (error.code === 'COMMENT_TOO_LONG') {
    return Response.error(res, error.message, 400, { code: 'COMMENT_TOO_LONG' });
  }
  return null;
}

async function counts(req, res, next) {
  try {
    const data = await paragraphCommentService.getCounts(req.query);
    return Response.success(res, data);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await paragraphCommentService.listComments(req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function create(req, res, next) {
  try {
    const comment = await paragraphCommentService.createComment(req.user.id, req.body);
    return Response.created(res, comment, '段评已发布');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function like(req, res, next) {
  try {
    const result = await paragraphCommentService.likeComment(req.params.id);
    return Response.success(res, result, '点赞成功');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function unlike(req, res, next) {
  try {
    const result = await paragraphCommentService.unlikeComment(req.params.id);
    return Response.success(res, result, '取消点赞成功');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await paragraphCommentService.removeComment(req.user.id, req.params.id);
    return Response.success(res, result, result.deleted ? '删除成功' : '段评不存在');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

module.exports = {
  counts,
  create,
  like,
  list,
  remove,
  unlike
};
