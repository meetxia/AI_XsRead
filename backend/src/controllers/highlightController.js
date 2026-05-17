const Response = require('../utils/response');
const highlightService = require('../services/highlightService');

function knownError(res, error) {
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
    const result = await highlightService.createHighlight(req.user.id, req.body);
    return Response.created(res, result, '划线已保存');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await highlightService.listHighlights(req.user?.id || null, req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const result = await highlightService.listHighlights(req.user.id, req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await highlightService.updateHighlight(req.user.id, req.params.id, req.body);
    return Response.success(res, result, result.updated ? '更新成功' : '无变更');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await highlightService.removeHighlight(req.user.id, req.params.id);
    return Response.success(res, result, result.deleted ? '删除成功' : '划线不存在');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function listMyNotes(req, res, next) {
  try {
    const result = await highlightService.listHighlights(req.user.id, {
      ...req.query,
      onlyNotes: true
    });
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function listHotNotesForNovel(req, res, next) {
  try {
    const result = await highlightService.listHotNotesForNovel(req.params.novelId, req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

module.exports = {
  create,
  list,
  listHotNotesForNovel,
  listMine,
  listMyNotes,
  remove,
  update
};
