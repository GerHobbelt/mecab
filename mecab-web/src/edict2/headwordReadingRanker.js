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

  _classifyRelevanceHeadwordReading(headword, readingObj) {
    const { reading } = readingObj;
    const { form, tags } = reading;
    const { readingHiragana } = this._mecabToken;
    const term = this._searchTermRecommender.getRecommendedSearchTerm(this._mecabToken);
    let relevance = 0;
    if (headword === term) {
      relevance++;
    }
    if (headword === readingHiragana) {
      relevance++;
    }
    if (form === readingHiragana) {
      relevance++;
    }
    if (tags.priorityEntry) {
      relevance++;
    }
    // console.log(
    //   term,
    //   readingHiragana,
    //   headword,
    //   form,
    //   tags,
    //   reading,
    //   relevance,
    //   )
    return relevance;
  }

  getMostRelevantHeadwordReading(headwordReadings) {
    const term = this._searchTermRecommender.getRecommendedSearchTerm(this._mecabToken);
    const result = headwordReadings
    .reduce((headwordReadingAcc, { headword, readingObjs }) => {
      const proposed = readingObjs.reduce((readingAcc, readingObj) => {
        const relevance = this._classifyRelevanceHeadwordReading(
          headword,
          readingObj);
        if (relevance > readingAcc.relevance) {
          return {
            relevance,
            proposed: {
              headword,
              readingObj,
            },
          }
        }
        return readingAcc;
      }, {
        relevance: -1,
        proposed: undefined,
      }).proposed;
      // always expected to be true, since we shouldn't produce empty array of reading tuples
      if (proposed) {
        const relevance = this._classifyRelevanceHeadwordReading(
          headword,
          proposed.readingObj);
        if (relevance > headwordReadingAcc.relevance) {
          return {
            relevance,
            proposed,
          }
        }
      }
      return headwordReadingAcc;
    }, {
      relevance: -1,
      proposed: undefined,
    });
    return result.proposed;
  }
}