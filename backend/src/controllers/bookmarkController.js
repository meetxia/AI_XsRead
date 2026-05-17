const Response = require('../utils/response');
const bookmarkService = require('../services/bookmarkService');

function handleKnownError(res, error) {
  if (error.httpStatus) {
    return Response.error(res, error.message, error.httpStatus);
  }
  if (error.code === 'COMMENT_TOO_LONG') {
    return Response.error(res, error.message, 400, { code: 'COMMENT_TOO_LONG' });
  }
  return null;
}

async function create(req, res, next) {
  try {
    const bookmark = await bookmarkService.createBookmark(req.user.id, req.body);
    return Response.created(res, bookmark, '书签已保存');
  } catch (error) {
    return handleKnownError(res, error) || next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const result = await bookmarkService.listByNovel(req.user.id, null, req.query);
    return Response.success(res, result);
  } catch (error) {
    return handleKnownError(res, error) || next(error);
  }
}

async function listByNovel(req, res, next) {
  try {
    const result = await bookmarkService.listByNovel(req.user.id, req.params.novelId, req.query);
    return Response.success(res, result);
  } catch (error) {
    return handleKnownError(res, error) || next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await bookmarkService.removeBookmark(req.user.id, req.params.id);
    return Response.success(res, result, result.deleted ? '删除成功' : '书签不存在');
  } catch (error) {
    return handleKnownError(res, error) || next(error);
  }
}

module.exports = {
  create,
  listByNovel,
  listMine,
  remove
};
