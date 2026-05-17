const Response = require('../utils/response');
const authorService = require('../services/authorService');

function knownError(res, error) {
  if (error.httpStatus) {
    return Response.error(res, error.message, error.httpStatus);
  }
  return null;
}

async function getAuthor(req, res, next) {
  try {
    const data = await authorService.getAuthor(req.params.authorId, req.user?.id || null);
    return Response.success(res, data);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function listAuthorNovels(req, res, next) {
  try {
    const result = await authorService.listAuthorNovels(req.params.authorId, req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function follow(req, res, next) {
  try {
    const result = await authorService.followAuthor(req.user.id, req.params.authorId);
    return Response.success(res, result, '关注成功');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function unfollow(req, res, next) {
  try {
    const result = await authorService.unfollowAuthor(req.user.id, req.params.authorId);
    return Response.success(res, result, '已取消关注');
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

async function listFollowing(req, res, next) {
  try {
    const result = await authorService.listFollowingAuthors(req.user.id, req.query);
    return Response.success(res, result);
  } catch (error) {
    return knownError(res, error) || next(error);
  }
}

module.exports = {
  follow,
  getAuthor,
  listAuthorNovels,
  listFollowing,
  unfollow
};
