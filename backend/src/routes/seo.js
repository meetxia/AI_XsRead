const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const seoService = require('../services/seoService');

const router = express.Router();

router.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(seoService.generateRobotsTxt());
});

router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const xml = await seoService.generateSitemapXml();
  res.type('application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}));

module.exports = router;
