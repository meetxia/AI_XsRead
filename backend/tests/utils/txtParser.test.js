const { parseTxtContent } = require('../../src/utils/txtParser');

function longContent(seed = '她摘下戒指离开') {
  return Array.from({ length: 80 }, (_, index) => `${seed} 第${index + 1}段，她终于决定把自己的人生拿回来。`).join('\n\n');
}

describe('txtParser', () => {
  test('parseTxtContent restores UTF-8 Chinese filenames decoded as latin1 by multipart parsers', () => {
    const title = '他以为她只是闹脾气，直到她摘下戒指离开';
    const mojibakeName = Buffer.from(`${title}.txt`, 'utf8').toString('latin1');

    const result = parseTxtContent(longContent(), mojibakeName);

    expect(result.title).toBe(title);
  });
});
