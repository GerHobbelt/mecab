export class ParsedEntriesSorter {
  _quantifyRelevance(relevance) {
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

  sortByRelevance(parsedEntries) {
    return parsedEntries.sort((parsedEntryLeft, parsedEntryRight) => {
      const leftMerits = this._quantifyRelevance(parsedEntryLeft.relevance);
      const rightMerits = this._quantifyRelevance(parsedEntryRight.relevance);
      return rightMerits - leftMerits;
    });
  }
}

export class ParsedEntryRelevanceClassifier {
  constructor({
    searchTermRecommender,
  }) {
    this._searchTermRecommender = searchTermRecommender;
  }

  classifyRelevance(mecabToken, results) {
    const { token, readingHiragana, dictionaryForm } = mecabToken;
    const term = this._searchTermRecommender.getRecommendedSearchTerm.getSearchTerm(mecabToken);
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

export class ParsedEntryRelevancePipelineFactory {
  constructor({
    relevanceClassifier,
  }) {
    this._relevanceClassifier = relevanceClassifier;
  }

  construct(mecabToken) {
    return new ParsedEntryRelevancePipeline({
      relevanceClassifier: this._relevanceClassifier,
      mecabToken,
    });
  }
}

export class ParsedEntryRelevancePipeline {
  constructor({
    mecabToken,
    relevanceClassifier,
  }) {
    this._relevanceClassifier = relevanceClassifier;
    this._mecabToken = mecabToken;
  }

  withRelevanceInfo(parsedEntry) {
    const withRelevanceClassified = this._relevanceClassifier.classifyRelevance(this._mecabToken, parsedEntry);
    return withRelevanceClassified;
  }
}