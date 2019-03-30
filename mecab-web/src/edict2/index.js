import edictAbbr from './abbrev.js';
import { toSubtokensWithKanjiReadings } from '../tokenizer/index.js'

function parseEdictMeaningSection(meaningSection) {
	// console.log(meaningSection);
  return meaningSection;
}

function parseEnamdictMeaningSection(meaningSection) {
  return meaningSection;
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
  // console.warn(term);
  // console.warn(results);
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

/**
 * 二(P);２;弐;貳(oK);貮(oK) [に(P);ふた;ふ;ふう] /(num) (ふ and ふう used mainly when counting aloud. 弐, 貳 and 貮 are used in legal documents.) two/(P)/EntL1461140X/
 * Cross product of all headwords by all readings
 *
 * 双子(P);二子;ふた子 [ふたご(P);そうし(双子)] /(n) twins/twin/(P)/EntL1398750X/
 * But if reading has misc tags (双子): that's a whitelist of headwords for that reading.
 *
 * お待ちどおさま;お待ち遠様;御待ち遠様;お待ち遠さま;お待ちどお様;お待ちどうさま(ik);お待ちどう様(ik) [おまちどおさま(お待ちどおさま,お待ち遠様,御待ち遠様,お待ち遠さま,お待ちどお様);おまちどうさま(お待ちどおさま,お待ち遠様,御待ち遠様,お待ち遠さま,お待ちどうさま,お待ちどう様)(ik)] /(exp) I'm sorry to have kept you waiting/EntL1002360X/
 * This one looks like a pretty good stress-test.
 *
 * か /(prt) (1) (used at sentence-end; indicates a question (sometimes rhetorical)) yes?/no?/isn't it?/is it?/(2) (after each alternative) or/whether or not/(3) (after an interrogative) (See 何か) some- (e.g. something, someone)/(4) (indicates doubt, uncertainty, etc.; sometimes after other particles) (See とか) hmm/huh/(pref) (5) (emphatic prefix; usu. before an adjective) (See か弱い) very/(suf) (6) (suffix forming adjectives or adverbs; after an indeclinable word) (See 定か) -al/-ial/-ic/-ical/-ish/-y/(adv) (7) (arch) in that way/(P)/EntL2028970X/
 * かあ /(n) cawing (of a crow)/EntL2076470X/
 * Some headwords have no readings (e.g. if there's no kanji).
 */
function getHeadwordReadingCombinations(kanjidic2Lookup, headwords, readings) {
  const headwordForms = headwords.map((headword) => headword.form);
  return readings.reduce((acc, reading) => {
    return acc.concat(
      headwordForms.reduce((acc2, headwordForm) => {
        // empty array means no whitelist means accept all
        if (!reading.tags.misc.length) {
          return acc2.concat({
            headword: headwordForm,
            reading: reading.form,
          });
        }
        if (reading.tags.misc.includes(headwordForm)) {
          return acc2.concat({
            headword: headwordForm,
            reading: reading.form,
          });
        }
        return acc2;
      },
      [])
    );
  }, [])
  .map(({ headword, reading }) => ({
    headword,
    reading,
    subtokens: toSubtokensWithKanjiReadings(
      kanjidic2Lookup,
      headword,
      reading,
      ),
  }));
}

function headwordReadingCombinationsSorted(grouped) {
  return Object.keys(grouped)
    .sort((leftHeadword, rightHeadword) => leftHeadword.localeCompare(rightHeadword, 'ja-JP'))
    .map(headword => ({
      headword,
      readingTuples: grouped[headword]
        .sort((left, right) => left.reading.localeCompare(right.reading, 'ja-JP')),
    }));
}

function groupHeadwordReadingCombinations(tuples) {
  return tuples.reduce((
    acc,
    {
      headword,
      reading,
      subtokens,
    }) => ({
    ...acc,
    [headword]: [
    ...(acc[headword] || []),
    {
      reading,
      subtokens,
    }]
  }), {});
}

function getMostRelevantHeadwordReadingCombination(term, headwordReadingsTuples) {
  const result = headwordReadingsTuples
  .reduce((headwordTupleAcc, { headword, readingTuples }) => {
    const bestReadingRuple = readingTuples.reduce((readingTupleAcc, readingTuple) => {
      const { reading, subtokens } = readingTuple;
      const proposed = readingTuple;
      return {
        ...readingTupleAcc,
        first: readingTupleAcc.first || proposed,
        best: proposed,
      };
    }, {
      first: undefined,
      best: undefined,
    }).best;
    const proposed = {
      headword,
      readingTuple: bestReadingRuple,
    };
    return {
      ...headwordTupleAcc,
      first: headwordTupleAcc.first || proposed,
      best: (term === headword && proposed) || headwordTupleAcc.best,
    };
  }, {
    first: undefined,
    best: undefined,
  });
  return result.best
  || result.first;
}

function parseEdictLine(
  kanjidic2Lookup,
  relevantHeadwordReadingCombinationGetter,
  glossParser,
  line,
  ) {
  // console.log(line);
  const [indexSection, meaningSection] = line.split('/', 2);
  const [headwordSection, readingSection] = indexSection.split(' ', 2);
  
  const headwords = parseEntrySection(headwordSection);

  let readings = [];
  const readingSectionInner = /^\[(.*)\]$/.exec(readingSection);
  if (readingSectionInner && readingSectionInner.length > 1) {
    readings = parseEntrySection(readingSectionInner[1]);
  }

  const headwordReadingCombinations = headwordReadingCombinationsSorted(
    groupHeadwordReadingCombinations(
      getHeadwordReadingCombinations(
        kanjidic2Lookup,
        headwords,
        readings)));

  const bestHeadwordReadingCombination
  = relevantHeadwordReadingCombinationGetter(headwordReadingCombinations);

  return {
    line,
    headwords,
    readings,
    headwordReadingCombinations,
    bestHeadwordReadingCombination,
    meaning: glossParser(meaningSection),
  };
}

/** @author bobince
  * @see https://stackoverflow.com/a/3561711/5257399 */
function regExpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function edictLookup([edict2Text, enamdictText, kanjidic2Lookup], term) {
	const regexp = new RegExp(
  `^(.*(^|[\\[;])${
    regExpEscape(term)
  }[\\]\\(; ].*)$`, 'mg');
  const edict2Matches = (edict2Text.match(regexp) || []);
  const enamDictMatches = (enamdictText.match(regexp) || []);

  const relevantHeadwordReadingCombinationGetter
  = getMostRelevantHeadwordReadingCombination.bind(null, term)

  return {
    edict2: sortByRelevance(
      classifyRelevance(
        term,
        edict2Matches.map(
          parseEdictLine.bind(
            null,
            kanjidic2Lookup,
            relevantHeadwordReadingCombinationGetter,
            parseEdictMeaningSection)))),
    enamdict: sortByRelevance(
      classifyRelevance(
        term,
        enamDictMatches.map(
          parseEdictLine.bind(
            null,
            kanjidic2Lookup,
            relevantHeadwordReadingCombinationGetter,
            parseEnamdictMeaningSection)))),
  }
}

export {
	edictLookup,
  classifyRelevance,
  quantifyRelevance,
};