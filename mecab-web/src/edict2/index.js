import edictAbbr from './abbrev.js';
import { toSubtokensWithKanjiReadings } from '../tokenizer/index.js'

export class Edict2MeaningSectionParser {
  parse(meaningSection) {
    return meaningSection;
  }
}

export class EnamdictMeaningSectionParser {
  parse(meaningSection) {
    return meaningSection;
  }
}

export class Edict2LikeParsedEntrySorter {
  quantifyRelevance(relevance) {
    let merits = 0;
    if (relevance.queryMatchesHeadword) {
      merits++;
    }
    // if (relevance.queryMatchesPriorityHeadword) {
    //   merits++;
    // }
    if (relevance.queryMatchesReading) {
      merits++;
    }
    // if (relevance.queryMatchesPriorityReading) {
    //   merits++;
    // }
    // relevance.merits = merits;
    return merits;
  }

  sortByRelevance(results) {
    return results.sort((left, right) => {
      const leftMerits = this.quantifyRelevance(left.relevance);
      const rightMerits = this.quantifyRelevance(right.relevance);
      return rightMerits - leftMerits;
    });
  }
}

export class Edict2LikeParsedEntryRelevanceClassifier {
  constructor({
    mecabOutputParser: { getRecommendedSearchTerm, },
  }) {
    this.getRecommendedSearchTerm = getRecommendedSearchTerm;
  }

  classifyRelevance(mecabToken, results) {
    const { token, readingHiragana, dictionaryForm } = mecabToken;
    const term = this.getRecommendedSearchTerm.getSearchTerm(mecabToken);
    // console.warn(term);
    // console.warn(results);
    return results.map((result) => ({
      relevance: {
        queryMatchesHeadword: result.headwords.reduce((acc, curr) => {
          return acc || curr.form === term;
        }, false),
        // queryMatchesPriorityHeadword: result.headwords.reduce((acc, curr) => {
        //   return acc || (curr.tags.priorityEntry && curr.form === term);
        // }, false),
        queryMatchesReading: result.readings.reduce((acc, curr) => {
          return acc || curr.form === readingHiragana;
        }, false),
        // queryMatchesPriorityReading: result.readings.reduce((acc, curr) => {
        //   return acc || (curr.tags.priorityEntry && curr.form === readingHiragana);
        // }, false),
      },
      result,
    }));
  }
}

export class Edict2LikeParsedEntryRelevancePipelineFactory {
  constructor({
    relevanceClassifier,
    relevanceSorter,
  }) {
    this._relevanceClassifier = relevanceClassifier;
    this._relevanceSorter = relevanceSorter;
  }

  construct(mecabToken) {
    return new Edict2LikeParsedEntryRelevancePipeline({
      relevanceClassifier: this._relevanceClassifier,
      relevanceSorter: this._relevanceSorter,
      mecabToken,
    });
  }
}

export class Edict2LikeParsedEntryRelevancePipeline {
  constructor({
    mecabToken,
    relevanceClassifier,
    relevanceSorter,
  }) {
    this._relevanceClassifier = relevanceClassifier;
    this._relevanceSorter = relevanceSorter;
    this._mecabToken = mecabToken;
  }

  withRelevanceInfo(parsedEntry) {
    const withRelevanceClassified = this._relevanceClassifier.classifyRelevance(this._mecabToken, parsedEntry);
    const sortedByRelevance = this._relevanceSorter.sortByRelevance(withRelevanceClassified);
    return sortedByRelevance;
  }
}

export class ReadingRankerFactory {
  constructor({
    mecabOutputParser: { getRecommendedSearchTerm, },
  }) {
    this._mecabOutputParser = mecabOutputParser;
  }

  construct(mecabToken) {
    return new ReadingRanker({
      mecabOutputParser: this._mecabOutputParser,
      mecabToken: this._mecabToken,
    });
  }
}

export class ReadingRanker {
  constructor({
    mecabOutputParser: { getRecommendedSearchTerm, },
    mecabToken,
  }) {
    this._mecabToken = mecabToken;
    this._getRecommendedSearchTerm = getRecommendedSearchTerm;
  }

  _classifyRelevanceHeadwordReadingCombination(
    { headword, readingTuple },
    ) {
    const { token, readingHiragana, dictionaryForm } = this._mecabToken;
    const { reading } = readingTuple;
    const term = this._getRecommendedSearchTerm(this._mecabToken);
    let relevance = 0;
    if (headword === term) {
      relevance++;
    }
    if (headword === readingHiragana) {
      relevance++;
    }
    if (reading === readingHiragana) {
      relevance++;
    }
    return relevance;
  }

  getMostRelevantHeadwordReadingCombination(headwordReadingsTuples) {
    const term = this._getRecommendedSearchTerm(this._mecabToken);
    const result = headwordReadingsTuples
    .reduce((headwordTupleAcc, { headword, readingTuples }) => {
      const proposed = readingTuples.reduce((readingTupleAcc, readingTuple) => {
        const proposed = {
          headword,
          readingTuple,
        };
        const relevance = this._classifyRelevanceHeadwordReadingCombination(
          this._mecabToken,
          proposed);
        if (relevance > readingTupleAcc.relevance) {
          return {
            relevance,
            proposed,
          }
        }
        return readingTupleAcc;
      }, {
        relevance: -1,
        proposed: undefined,
      }).proposed;
      const relevance = this._classifyRelevanceHeadwordReadingCombination(
        this._mecabToken,
        proposed);
      if (relevance > headwordTupleAcc.relevance) {
        return {
          relevance,
          proposed,
        }
      }
      return headwordTupleAcc;
    }, {
      relevance: -1,
      proposed: undefined,
    });
    return result.proposed;
  }
}

export class Edict2LikeMatcher {
  constructor({
    text,
    regExpEscape,
  }) {
    this.text = text;
    this.regExpEscape = regExpEscape;
  }

  _buildRegex(term) {
    return new RegExp(
    `^(.*(^|[\\[;])${
      regExpEscape(term)
    }[\\]\\(; ].*)$`, 'mg');
  }

  match(term) {
    const regexp = this._buildRegex(term);
    return this.text.match(regexp) || [];
  }
}

// export class Edict2LikeParserFactory {
//   constructor({
//     readingRankerFactory,
//     glossParser,
//   }) {
//     this._readingRankerFactory = readingRankerFactory;
//     this._glossParser = glossParser;
//   }

//   construct(mecabToken) {
//     return new Edict2LikeParser({
//       readingRanker: this._readingRankerFactory.construct(mecabToken),
//       glossParser: this._glossParser,
//     })
//   }
// }

export class Edict2LikeParser {
  constructor({
    glossParser,
  }) {
    this._glossParser = glossParser;
  }

  _parseTags(tagsSection) {
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

  _parseEntry(entry) {
    const [whole, form, tagsSection] = /([^\(\)]*)(.*)/.exec(entry);
    return {
      form,
      tags: this._parseTags(tagsSection),
    };
  }

  _parseEntrySection(section) {
    const entries = section.split(';');
    return entries.map(this._parseEntry);
  }

  parseEdictLine(line) {
    // console.log(line);
    const [indexSection, meaningSection] = line.split('/', 2);
    const [headwordSection, readingSection] = indexSection.split(' ', 2);
    
    const headwords = this._parseEntrySection(headwordSection);

    let readings = [];
    const readingSectionInner = /^\[(.*)\]$/.exec(readingSection);
    if (readingSectionInner && readingSectionInner.length > 1) {
      readings = this._parseEntrySection(readingSectionInner[1]);
    }

    return {
      line,
      headwords,
      readings,
      meaning: this._glossParser(meaningSection),
    };
  }
}

export class Edict2LikeParsedEntryEnricher {
  constructor({
    readingRanker,
    parsedEntrySorter,
    parsedEntryReadingsResolver,
  }) {
    this.readingRanker = readingRanker;
    this.parsedEntrySorter = parsedEntrySorter;
    this.parsedEntryReadingsResolver = parsedEntryReadingsResolver;
  }

  enrich(parsedEntry) {
    const headwordReadingCombinations = this.parsedEntrySorter.headwordReadingCombinationsSorted(
      this.parsedEntrySorter.groupHeadwordReadingCombinations(
        this.parsedEntryReadingsResolver.getHeadwordReadingCombinations(
          headwords,
          readings)));

    const bestHeadwordReadingCombination
    = this.readingRanker.getMostRelevantHeadwordReadingCombination(headwordReadingCombinations);

    return {
      ...parsedEntry,
      headwordReadingCombinations,
      bestHeadwordReadingCombination,
    };
  }
}

export class Edict2LikeParsedEntryReadingPipeline {
  constructor({
    parsedEntryEnricher,
    parsedEntryReadingSorter,
  }) {
    this._parsedEntryEnricher = parsedEntryEnricher;
    this._parsedEntryReadingSorter = parsedEntryReadingSorter;
  }

  withReadings(parsedEntry) {

  }
}

export class Edict2LikeParsedEntryPipeline {
  constructor({
    parser,
    readingPipeline,
    relevancePipeline,
  }) {
    this._parser = parser;
    this._relevancePipeline = relevancePipeline;
  }

  parse(line) {

  }
}

export class Edict2LikeParsedEntryReadingsResolver {
  constructor({
    furiganaFitter,
  }) {
    this._furiganaFitter = furiganaFitter;
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
  getHeadwordReadingCombinations(headwords, readings) {
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
      subtokens: this._furiganaFitter.fitFurigana(
        headword,
        reading,
        ),
    }));
  }
}

export class Edict2LikeParsedEntryReadingSorter {
  groupHeadwordReadingCombinations(tuples) {
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

  headwordReadingCombinationsSorted(grouped) {
    return Object.keys(grouped)
      .sort((leftHeadword, rightHeadword) => leftHeadword.localeCompare(rightHeadword, 'ja-JP'))
      .map(headword => ({
        headword,
        readingTuples: grouped[headword]
          .sort((left, right) => left.reading.localeCompare(right.reading, 'ja-JP')),
      }));
  }
}

export class Dictionaries {
  constructor({
    mecabOutputParser: { getRecommendedSearchTerm, },
    edict2: {
      // parserFactory,
      parser,
      matcher,
    },
    enamdict: {
      // parserFactory,
      parser,
      matcher,
    },
    parsedEntryRelevancePipelineFactory,
  }) {
    this._getRecommendedSearchTerm = getRecommendedSearchTerm;
    this._parsedEntryRelevancePipeline = parsedEntryRelevancePipeline;
    this._edict2 = edict2;
    this._enamdict = enamdict;
  }

  lookup(mecabToken) {
    const term = this._getRecommendedSearchTerm(mecabToken);
    const edict2Matches = this._edict2.matcher.match(term);
    const enamDictMatches = this._enamdict.matcher.match(term);

    // const edict2Parser = this._edict2.parserFactory.construct(mecabToken);
    // const enamdict2Parser = this._enamdict.parserFactory.construct(mecabToken);

    const parsedEntryRelevancePipeline = this._parsedEntryRelevancePipelineFactory.construct(mecabToken);

    return {
      edict2: parsedEntryRelevancePipeline.withRelevanceInfo(
          edict2Matches.map((match) => this.edict2.parser.parse(match))),
      enamdict: parsedEntryRelevancePipeline.withRelevanceInfo(
          enamDictMatches.map((match) => this.enamdict2.parser.parse(match))),
    }
  }
}

export {
	edictLookup,
  getSearchTerm,
  classifyRelevance,
  quantifyRelevance,
};