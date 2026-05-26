#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = `Usage:
  node scripts/count-chapter-words.mjs <chapter-file> [--json|--pretty]

Examples:
  node scripts/count-chapter-words.mjs "docs/小说/带豆包穿越回明朝/小说正文/卷一_入局/第001章 豆包说别喝那碗药.txt"
  node scripts/count-chapter-words.mjs "docs/小说/带豆包穿越回明朝/小说正文/卷一_入局/第001章 豆包说别喝那碗药.txt" --json

Novel word-count convention:
  charactersExcludingWhitespace is the recommended chapter word count. It removes spaces, tabs, and line breaks.
`;

export function countText(text) {
  const normalizedLines = text.length === 0 ? [] : text.split(/\r?\n/);
  const withoutWhitespace = text.replace(/\s/gu, '');

  return {
    totalCharactersIncludingWhitespace: [...text].length,
    charactersExcludingWhitespace: [...withoutWhitespace].length,
    cjkChineseCharactersOnly: countMatches(
      text,
      /[\p{Script=Han}\u3400-\u4dbf\uf900-\ufaff]/gu,
    ),
    punctuationAndSymbols: countMatches(text, /[\p{P}\p{S}]/gu),
    lines: normalizedLines.length,
  };
}

export function countFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const stats = fs.statSync(absolutePath);
  const counts = countText(text);

  return {
    file: absolutePath,
    fileBytes: stats.size,
    ...counts,
    recommendedNovelWordCount: counts.charactersExcludingWhitespace,
  };
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function parseArgs(argv) {
  const args = [...argv];
  const help = args.includes('--help') || args.includes('-h');
  const json = args.includes('--json');
  const pretty = args.includes('--pretty');
  const filePath = args.find((arg) => !arg.startsWith('-'));

  return { filePath, help, json, pretty };
}

function formatHuman(result) {
  return [
    `文件: ${result.file}`,
    `推荐章节字数（去空白）: ${result.recommendedNovelWordCount}`,
    `全文字符数（含空白）: ${result.totalCharactersIncludingWhitespace}`,
    `纯中文汉字数: ${result.cjkChineseCharactersOnly}`,
    `标点/符号数: ${result.punctuationAndSymbols}`,
    `行数: ${result.lines}`,
    `文件大小: ${result.fileBytes} bytes`,
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const { filePath, help, json, pretty } = parseArgs(argv);

  if (help) {
    console.log(USAGE.trim());
    return 0;
  }

  if (!filePath) {
    console.error(USAGE.trim());
    return 1;
  }

  try {
    const result = countFile(filePath);

    if (json || pretty) {
      console.log(JSON.stringify(result, null, pretty ? 2 : 0));
    } else {
      console.log(formatHuman(result));
    }

    return 0;
  } catch (error) {
    console.error(`字数统计失败: ${error.message}`);
    return 1;
  }
}

const isCli = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  process.exitCode = main();
}
