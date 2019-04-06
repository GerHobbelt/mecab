import edictAbbr from './abbrev.js';
import { toSubtokensWithKanjiReadings } from '../tokenizer/index.js'

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