const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const stat = promisify(fs.stat);
const readline = require('readline');

let inputPath;
if (process.argv.length >= 3) {
  inputPath = process.argv[2];
} else {
  inputPath = path.join(__dirname, 'edict2.utf16le.txt');
}
if (!fs.existsSync(inputPath)) {
  throw new Error(`File not found: ${inputPath}
Usage: node edict2-indexer.js edict2.utf16le.txt`);
}

async function processLineByLine() {
  const fileStream = fs.createReadStream(inputPath, {encoding: 'utf16le'});

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const readingTrailerMatcher = /\((P|ik)\)$/
  const tokenTrailerMatcher = /\((P|iK)\)$/
  const readingsMatcher = /^\[(.*)\]$/
  const literationMatcher = /^(.*)\((.*)\)$/
  const utf16NewlineLen = 2;
  let ix = 0;
  let n = 0;
  // http://www.edrdg.org/jmdict/edict_doc.html
  rl.on('line', (line) => {
    const [formText, detailText] = line.split('/', 2);
    const [tokensText, readingsText] = formText.split(' ', 2);
    const nominalTokens = tokensText.split(';');
    const strippedTokens = nominalTokens.map((token) => {
      return token.replace(tokenTrailerMatcher, '');
    });
    const readingMatches = readingsMatcher.exec(readingsText);
    if (readingMatches && readingMatches.length > 1) {
      const readingsRaw = readingMatches[1];
      const readingTuples = readingsRaw.split(';')
      strippedReadingTuples = readingTuples.map((token) => {
        return token.replace(readingTrailerMatcher, '');
      })
      const literations = strippedReadingTuples.map((tuple) => {
        const literationMatches = literationMatcher.exec(tuple);
        if (literationMatches && literationMatches.length > 2) {
          return {
            phonetic: literationMatches[1],
            roman: literationMatches[2],
          }
        }
        return {
          phonetic: tuple,
        }
      })
      console.log(literations)
      // console.log(readingTuples)
    }
    rl.close();
  });

}

processLineByLine();

/*
const td = new TextDecoder('utf-16le')
fetch('edict2.utf16le.txt')
.then((response)=>response.arrayBuffer())
.then((buffer) => console.log(td.decode(buffer.slice(0, 100))));
*/