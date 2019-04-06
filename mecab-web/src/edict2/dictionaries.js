// export class Edict2LikeDictionary {
//   constructor({
//     matchPipelineFactory,
//     matchesPipelineFactory,
//   }) {
//     this._matchPipelineFactory = matchPipelineFactory;
//     this._matchesPipelineFactory = matchesPipelineFactory;
//   }

//   lookup(term) {

//   }
// }

export class Dictionaries {
  constructor({
    searchTermRecommender,
    edict2: {
      matchPipelineFactory,
      matchesPipelineFactory,
    },
    enamdict: {
      matchPipelineFactory,
      matchesPipelineFactory,
    },
    headwordReadingRankerFactory,
    headwordReadingPipelineFactory,
    parsedEntryRelevancePipelineFactory,
    // parsedEntryPipelineFactory,
  }) {
    this._searchTermRecommender = searchTermRecommender;
    this._parsedEntryRelevancePipelineFactory = parsedEntryRelevancePipelineFactory;
    // this._parsedEntryPipelineFactory = parsedEntryPipelineFactory;
    // this._matchesPipelineFactory = matchesPipelineFactory;
    this._edict2 = edict2;
    this._enamdict = enamdict;
  }

  lookup(mecabToken) {
    const term = this._searchTermRecommender.getRecommendedSearchTerm(mecabToken);

    const parsedEntryRelevancePipeline = this._parsedEntryRelevancePipelineFactory.construct(mecabToken);
    // const parsedEntryPipeline = this._parsedEntryPipelineFactory.construct(parsedEntryRelevancePipeline);

    const edict2MatchPipeline = this._edict2.matchPipelineFactory.construct(parsedEntryRelevancePipeline);
    const enamdictMatchPipeline = this._enamdict.matchPipelineFactory.construct(parsedEntryRelevancePipeline);

    const edict2MatchesPipeline = this._edict2.matchesPipelineFactory.construct(edict2MatchPipeline);
    const enamdictMatchesPipeline = this._enamdict.matchesPipelineFactory.construct(enamdictMatchPipeline);
    
    // const edict2ParsedEntries = this._matchesPipelineFactory.lookup(term);
    // const enamdictParsedEntries = this._matchesPipelineFactory.lookup(term);
    // const enamDictMatches = this._enamdict.matcher.match(term);

    // return {
    //   edict2: parsedEntryRelevancePipeline.withRelevanceInfo(
    //       edict2Matches.map((match) => this.edict2.parser.parse(match))),
    //   enamdict: parsedEntryRelevancePipeline.withRelevanceInfo(
    //       enamDictMatches.map((match) => this.enamdict2.parser.parse(match))),
    // }

    return {
      edict2: edict2MatchesPipeline.lookup(term),
      enamdict: enamdictMatchesPipeline.lookup(term),
    }
  }
}