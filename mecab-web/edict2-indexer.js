#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const stat = promisify(fs.stat);
const readline = require('readline');

let inputPath;
if (process.argv.length >= 3) {
  inputPath = process.argv[2];
} else {
  inputPath = path.join(__dirname, 'edict2.utf8.txt');
}
if (!fs.existsSync(inputPath)) {
  throw new Error(`File not found: ${inputPath}
Usage: node edict2-indexer.js edict2.utf8.txt`);
}

// https://stackoverflow.com/a/3759300/5257399
String.prototype.getCodePointLength= function() {
  return this.length-this.split(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g).length+1;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt
function getWholeCharAndI(str, i) {
  var code = str.charCodeAt(i);

  if (Number.isNaN(code)) {
    return ''; // Position not found
  }
  if (code < 0xD800 || code > 0xDFFF) {
    return [str.charAt(i), i]; // Normal character, keeping 'i' the same
  }

  // High surrogate (could change last hex to 0xDB7F to treat high private 
  // surrogates as single characters)
  if (0xD800 <= code && code <= 0xDBFF) {
    if (str.length <= (i + 1)) {
      throw 'High surrogate without following low surrogate';
    }
    var next = str.charCodeAt(i + 1);
      if (0xDC00 > next || next > 0xDFFF) {
        throw 'High surrogate without following low surrogate';
      }
      return [str.charAt(i) + str.charAt(i + 1), i + 1];
  }
  // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
  if (i === 0) {
    throw 'Low surrogate without preceding high surrogate';
  }
  var prev = str.charCodeAt(i - 1);

  // (could change last hex to 0xDB7F to treat high private surrogates
  // as single characters)
  if (0xD800 > prev || prev > 0xDBFF) {
    throw 'Low surrogate without preceding high surrogate';
  }
  // Return the next character instead (and increment)
  return [str.charAt(i + 1), i + 1];
}

async function processLineByLine() {
  const fileStream = fs.createReadStream(inputPath, {encoding: 'utf8'});

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const readingTrailerMatcher = /\((P|ik)\)$/
  const tokenTrailerMatcher = /\((P|iK|ateji)\)$/
  const readingsMatcher = /^\[(.*)\]$/
  const literationMatcher = /^(.*)\((.*)\)$/
  const newlineBytes = 1;
  let ix = 0;
  let n = 0;
  // http://www.edrdg.org/jmdict/edict_doc.html
  // rl.on('line', (line) => {
  for await (const line of rl) {
    if (n++<1101) continue;
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
      // console.log(literations)
      // console.log(readingTuples)
    }
    // new Int8Array(1);
    strippedTokens[0] = '私の𩸽'
    console.log(strippedTokens)
    console.log(Buffer.from(strippedTokens[0], 'utf16le'));
    function lol(token) {
      if (!token.length) {
        return;
      }
      console.log(Buffer.from(token[0], 'utf16le'));
      lol(token.slice(1));
    }
    lol(strippedTokens[0]);
    // lol('私の𩸽');
    // rl.close();
    //あれ以来

    // useful encoding helpers (may not be needed for NodeJS, but could be needed in browser):
    // https://stackoverflow.com/a/24391376/5257399
    // https://stackoverflow.com/a/14641495/5257399
    break;
  }
  // });

}

processLineByLine();

/*
const td = new TextDecoder('utf-16le')
fetch('edict2.utf16le.txt')
.then((response)=>response.arrayBuffer())
.then((buffer) => console.log(td.decode(buffer.slice(0, 100))));
*/