export class ParsedEntrySorter {
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
    relevanceSorter,
  }) {
    this._relevanceClassifier = relevanceClassifier;
    this._relevanceSorter = relevanceSorter;
  }

  construct(mecabToken) {
    return new ParsedEntryRelevancePipeline({
      relevanceClassifier: this._relevanceClassifier,
      relevanceSorter: this._relevanceSorter,
      mecabToken,
    });
  }
}

export class ParsedEntryRelevancePipeline {
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