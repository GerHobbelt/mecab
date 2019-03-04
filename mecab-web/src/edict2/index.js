import edictAbbr from './abbrev.js';

function parseEdictMeaningSection(meaningSection) {
	console.log(meaningSection);
}

function parseEnamdictMeaningSection(meaningSection) {
}

function parseEntrySection(section) {
  const entries = section.split(';');
  return entries.map(parseEntry);
}

function parseTags(tagsSection) {
  const tagMatcher = /\(([^\(\)]*)\)/g;
  const kanji = [];
  const reading = [];
  const misc = [];
  let partOfSpeechSegment;
  let priorityEntry = false;
  while (partOfSpeechSegment = tagMatcher.exec(tagsSection)) {
    const tagContent = partOfSpeechSegment[1];
    if (tagContent === 'P') {
      priorityEntry = true;
    } else if (tagContent in edictAbbr.kanji) {
      kanji.push(tagContent);
    } else if (tagContent in edictAbbr.reading) {
      reading.push(tagContent);
    } else {
      misc.push(partOfSpeechSegment[1]);
    }
  }
  return {
    kanji,
    reading,
    misc,
    priorityEntry,
  }
}

function parseEntry(entry) {
  const [whole, form, tagsSection] = /([^\(\)]*)(.*)/.exec(entry);
  return {
    form,
    tags: parseTags(tagsSection),
  };
}

function parseEdictLine(glossParser, line) {
  const [indexSection, meaningSection] = line.split('/', 2);
  const [headwordSection, readingSection] = indexSection.split(' ', 2);
  
  const headwords = parseEntrySection(headwordSection);

  let readings = [];
  const readingSectionInner = /^\[(.*)\]$/.exec(readingSection);
  if (readingSectionInner && readingSectionInner.length > 1) {
    readings = parseEntrySection(readingSectionInner[1]);
  }

  return {
    headwords,
    readings,
    meaning: glossParser(meaningSection),
  };
}

/** @author bobince
  * @see https://stackoverflow.com/a/3561711/5257399 */
function regExpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function edictLookup([edict2Text, enamdictText], term) {
	const regexp = new RegExp(
  `^(.*(^|[\\[;])${
    regExpEscape(term)
  }[\\]\\(; ].*)$`, 'mg');
  const edict2Matches = (edict2Text.match(regexp) || []);
  const enamDictMatches = (enamdictText.match(regexp) || []);

  return {
    edict2: edict2Matches.map(parseEdictLine.bind(null, parseEdictMeaningSection)),
    enamdict: enamDictMatches.map(parseEdictLine.bind(null, parseEnamdictMeaningSection)),
  }
}

export {
	edictLookup,
};