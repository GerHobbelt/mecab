export class Edict2LikeDictionary {
  constructor({
    headwordReadingRankerFactory,
    headwordReadingPipelineFactory,
    parsedEntryRelevancePipelineFactory,
    matchPipelineFactory,
    matchesPipelineFactory,
  }) {
    this._headwordReadingRankerFactory = headwordReadingRankerFactory;
    this._headwordReadingPipelineFactory = headwordReadingPipelineFactory;
    this._parsedEntryRelevancePipelineFactory = parsedEntryRelevancePipelineFactory;
    this._matchPipelineFactory = matchPipelineFactory;
    this._matchesPipelineFactory = matchesPipelineFactory;
  }

  getMatchesPipeline(mecabToken) {
    const headwordReadingRanker = this._headwordReadingRankerFactory.construct(mecabToken);
    const headwordReadingPipeline = this._headwordReadingPipelineFactory.construct(headwordReadingRanker);
    const relevancePipeline = this._parsedEntryRelevancePipelineFactory.construct(mecabToken);
    const matchPipeline = this._matchPipelineFactory.construct({
      headwordReadingPipeline,
      relevancePipeline,
    });
    const matchesPipeline = this._matchesPipelineFactory.construct(matchPipeline);
    return matchesPipeline;
  }
}

export class Dictionaries {
  constructor({
    dictionaries: {
      edict2,
      enamdict,
    },
  }) {
    this._dictionaries = {
      edict2,
      enamdict,
    };
  }

  lookup(mecabToken) {
    const edict2MatchesPipeline = this._dictionaries.edict2.getMatchesPipeline(mecabToken);
    const enamdictMatchesPipeline = this._dictionaries.enamdict.getMatchesPipeline(mecabToken);

    return {
      edict2: edict2MatchesPipeline.lookup(term),
      enamdict: enamdictMatchesPipeline.lookup(term),
    }
  }
}