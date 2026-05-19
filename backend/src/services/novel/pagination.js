function getOffset(page, pageSize) {
  return (page - 1) * pageSize;
}

function createPagination(page, pageSize, total) {
  return {
    page: Number.parseInt(page, 10),
    pageSize: Number.parseInt(pageSize, 10),
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

function paginateTextByChars(fullText, options = {}) {
  const totalChars = fullText.length;
  const baseSize = Math.max(500, Math.min(20000, Number.parseInt(options.pageSize, 10)));

  const tolerance = Math.max(100, Math.floor(baseSize * 0.15));
  const windowMin = Math.max(1, baseSize - tolerance);
  const windowMax = baseSize + tolerance;
  const boundaryRegex = /[。！？.!?；;，,]\s|\n\n|\n/g;

  const pageEnds = [];
  let cursor = 0;
  while (cursor < totalChars) {
    const remaining = totalChars - cursor;
    if (remaining <= baseSize + tolerance) {
      pageEnds.push(totalChars);
      break;
    }

    const targetStart = cursor + windowMin;
    const targetEnd = Math.min(cursor + windowMax, totalChars);

    let bestBoundary = -1;
    boundaryRegex.lastIndex = targetStart;
    let match;
    while ((match = boundaryRegex.exec(fullText)) && match.index <= targetEnd) {
      bestBoundary = match.index + (match[0].length > 1 ? match[0].length : 1);
    }

    if (bestBoundary === -1) {
      boundaryRegex.lastIndex = targetEnd;
      const forward = boundaryRegex.exec(fullText);
      if (forward) {
        bestBoundary = forward.index + (forward[0].length > 1 ? forward[0].length : 1);
      }
    }

    if (bestBoundary === -1) {
      bestBoundary = cursor + baseSize;
    }

    if (bestBoundary <= cursor) {
      bestBoundary = Math.min(cursor + baseSize, totalChars);
    }

    pageEnds.push(bestBoundary);
    cursor = bestBoundary;
  }

  const totalPages = Math.max(1, pageEnds.length);
  const currentPage = Math.min(Math.max(1, Number.parseInt(options.page, 10)), totalPages);
  const sliceStart = currentPage === 1 ? 0 : pageEnds[currentPage - 2];
  const sliceEnd = pageEnds[currentPage - 1] || 0;

  return {
    page: currentPage,
    pageSize: baseSize,
    totalPages,
    totalChars,
    content: fullText.slice(sliceStart, sliceEnd)
  };
}

module.exports = {
  createPagination,
  getOffset,
  paginateTextByChars
};
