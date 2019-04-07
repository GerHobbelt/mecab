export class HeadwordReadingResolver {
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

export class HeadwordReadingSorter {
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

  withHeadwordReadingsSorted(grouped) {
    return Object.keys(grouped)
      .sort((leftHeadword, rightHeadword) => leftHeadword.localeCompare(rightHeadword, 'ja-JP'))
      .map(headword => ({
        headword,
        readingTuples: grouped[headword]
          .sort((left, right) => left.reading.localeCompare(right.reading, 'ja-JP')),
      }));
  }
}

export class HeadwordReadingPipelineFactory {
  constructor({
    headwordReadingSorter,
    headwordReadingResolver,
  }) {
    this._headwordReadingSorter = headwordReadingSorter;
    this._headwordReadingResolver = headwordReadingResolver;
  }

  construct(headwordReadingRanker) {
    return new HeadwordReadingPipeline({
      headwordReadingRanker,
      headwordReadingSorter: this._headwordReadingSorter,
      headwordReadingResolver: this._headwordReadingResolver,
    })
  }
}

export class HeadwordReadingPipeline {
  constructor({
    headwordReadingRanker,
    headwordReadingSorter,
    headwordReadingResolver,
  }) {
    this._headwordReadingRanker = headwordReadingRanker;
    this._headwordReadingSorter = headwordReadingSorter;
    this._headwordReadingResolver = headwordReadingResolver;
  }

  withHeadwordReadings(parsedEntry) {
    const headwordReadings = this._headwordReadingSorter.withHeadwordReadingsSorted(
      this._headwordReadingSorter.groupHeadwordReadingCombinations(
        this._headwordReadingResolver.getHeadwordReadingCombinations(
          parsedEntry.headwords,
          parsedEntry.readings)));

    const bestHeadwordReading
    = this._headwordReadingRanker.getMostRelevantHeadwordReadingCombination(headwordReadings);

    return {
      ...parsedEntry,
      headwordReadings,
      bestHeadwordReading,
    };
  }
}