import edictAbbr from './abbrev.js';

function parseEdictMeaningSection(meaningSection) {
	// console.log(meaningSection);
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

function classifyRelevance(term, results) {
  console.warn(term);
  console.warn(results);
  return results.map((result) => ({
    relevance: {
      queryMatchesHeadword: result.headwords.reduce((acc, curr) => {
        return acc || curr.form === term;
      }, false),
      queryMatchesPriorityHeadword: result.headwords.reduce((acc, curr) => {
        return acc || (curr.tags.priorityEntry && curr.form === term);
      }, false),
      queryMatchesReading: result.readings.reduce((acc, curr) => {
        return acc || curr.form === term;
      }, false),
      queryMatchesPriorityReading: result.readings.reduce((acc, curr) => {
        return acc || (curr.tags.priorityEntry && curr.form === term);
      }, false),
    },
    result,
  }));
}

function quantifyRelevance(relevance) {
  let merits = 0;
  if (relevance.queryMatchesHeadword) {
    merits++;
  }
  if (relevance.queryMatchesPriorityHeadword) {
    merits++;
  }
  if (relevance.queryMatchesReading) {
    merits++;
  }
  if (relevance.queryMatchesPriorityReading) {
    merits++;
  }
  return merits;
}

function sortByRelevance(results) {
  return results.sort((left, right) => {
    const leftMerits = quantifyRelevance(left);
    const rightMerits = quantifyRelevance(right);
    if (leftMerits > rightMerits) {
      return -1;
    } else if (leftMerits === rightMerits) {
      return 0;
    } else {
      return 1;
    }
  });
}

function parseEdictLine(glossParser, line) {
  console.log(line);
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
    edict2: sortByRelevance(
      classifyRelevance(
        term,
        edict2Matches.map(
          parseEdictLine.bind(
            null,
            parseEdictMeaningSection)))),
    enamdict: sortByRelevance(
      classifyRelevance(
        term,
        enamDictMatches.map(
          parseEdictLine.bind(
            null,
            parseEnamdictMeaningSection)))),
  }
}

export {
	edictLookup,
  classifyRelevance,
  quantifyRelevance,
};