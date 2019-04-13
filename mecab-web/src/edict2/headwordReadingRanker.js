export class HeadwordReadingRankerFactory {
  constructor({
    searchTermRecommender,
  }) {
    this._searchTermRecommender = searchTermRecommender;
  }

  construct(mecabToken) {
    return new HeadwordReadingRanker({
      searchTermRecommender: this._searchTermRecommender,
      mecabToken,
    });
  }
}

export class HeadwordReadingRanker {
  constructor({
    searchTermRecommender,
    mecabToken,
  }) {
    this._mecabToken = mecabToken;
    this._searchTermRecommender = searchTermRecommender;
  }

  _classifyRelevanceHeadwordReading(headword, readingTuple) {
    const { reading } = readingTuple;
    const { readingHiragana } = this._mecabToken;
    const term = this._searchTermRecommender.getRecommendedSearchTerm(this._mecabToken);
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
    console.log(readingTuple)
    // console.log(
    //   term,
    //   readingHiragana,
    //   headword,
    //   reading,
    //   relevance,
    //   )
    return relevance;
  }

  getMostRelevantHeadwordReading(headwordReadingsTuples) {
    const term = this._searchTermRecommender.getRecommendedSearchTerm(this._mecabToken);
    const result = headwordReadingsTuples
    .reduce((headwordTupleAcc, { headword, readingTuples }) => {
      const proposed = readingTuples.reduce((readingTupleAcc, readingTuple) => {
        const relevance = this._classifyRelevanceHeadwordReading(
          headword,
          readingTuple);
        if (relevance > readingTupleAcc.relevance) {
          return {
            relevance,
            proposed: {
              headword,
              readingTuple,
            },
          }
        }
        return readingTupleAcc;
      }, {
        relevance: -1,
        proposed: undefined,
      }).proposed;
      // always expected to be true, since we shouldn't produce empty array of reading tuples
      if (proposed) {
        const relevance = this._classifyRelevanceHeadwordReading(
          headword,
          proposed.readingTuple);
        if (relevance > headwordTupleAcc.relevance) {
          return {
            relevance,
            proposed,
          }
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