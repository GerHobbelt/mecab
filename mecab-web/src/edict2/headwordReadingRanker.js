export class HeadwordReadingRankerFactory {
  constructor({
    mecabOutputParser: { getRecommendedSearchTerm, },
  }) {
    this._mecabOutputParser = mecabOutputParser;
  }

  construct(mecabToken) {
    return new HeadwordReadingRanker({
      mecabOutputParser: this._mecabOutputParser,
      mecabToken: this._mecabToken,
    });
  }
}

export class HeadwordReadingRanker {
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