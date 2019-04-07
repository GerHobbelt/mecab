import {
  Dictionaries,
  Edict2LikeDictionary,

  Edict2LikeParser,
  Edict2LikeMatcher,

  Edict2GlossParser,
  EnamdictGlossParser,

  MatchPipelineFactory,

  MatchesPipelineFactory,

  ParsedEntryRelevancePipelineFactory,
  ParsedEntryRelevanceClassifier,
  ParsedEntrySorter,

  HeadwordReadingRankerFactory,
  HeadwordReadingPipelineFactory,
  HeadwordReadingSorter,
  HeadwordReadingResolver,

} from './edict2/index.js';

import {
  Mecab,
  MecabContext,
  MecabOutputParser,
  SearchTermRecommender,
  MecabTokenEnricher,
  MecabWhitespaceInterposer,
  MecabPipeline,
} from './mecab/index.js';

import { escapeRegExp, } from './util/index.js';
import { FuriganaFitter, } from './furiganaFitter/index.js';

import {
  Kanjidic2Matcher,
  Kanjidic2Parser,
  Kanjidic2,
} from './kanjidic2/index.js';

import { tokenize, toHiragana, } from './web_modules/wanakana.js';

export class Kanjidic2Factory {
  construct({
    kanjidic2Text,
  }) {
    return new Kanjidic2({
      kanjidic2Matcher: new Kanjidic2Matcher({
        kanjidic2Text,
        escapeRegExp,
      }),
      kanjidic2Parser: new Kanjidic2Parser(),
    })
  }
}

export class FuriganaFitterFactory {
  construct({
    kanjidic2,
    mecabConfig: {
      endOfSentence = 'EOS\n',
    },
  }) {
    const mecabOutputParser = new MecabOutputParser({
      escapeRegExp,
      config: mecabConfig,
    });
    const furiganaFitter = new FuriganaFitter({
      kanjidic2,
      wanakana: { tokenize },
      escapeRegExp,
    });
  }
}

export class MecabPipelineFactory {
  construct({
    mecab,
  }) {
    const mecabOutputParser = new MecabOutputParser({
      escapeRegExp,
      config: mecab.config,
    });
    return new MecabPipeline({
      mecab,
      mecabOutputParser,
      tokenEnricher: new MecabTokenEnricher({
        wanakana: { toHiragana, },
        furiganaFitter,
      }),
      whitespaceInterposer: new MecabWhitespaceInterposer(),
    })
  }
}

export class Edict2LikeDictionaryFactory {
  construct({
    text,
    glossParser,
    furiganaFitter,
  }) {
    const searchTermRecommender = new SearchTermRecommender();
    return new Edict2LikeDictionary({
      headwordReadingRankerFactory: new HeadwordReadingRankerFactory({
        searchTermRecommender,
      }),
      headwordReadingPipelineFactory: new HeadwordReadingPipelineFactory({
        parsedEntrySorter: new HeadwordReadingSorter(),
        parsedEntryReadingsResolver: new HeadwordReadingResolver({
          furiganaFitter,
        }),
      }),
      parsedEntryRelevancePipelineFactory: new ParsedEntryRelevancePipelineFactory({
        relevanceClassifier: new ParsedEntryRelevanceClassifier({
          searchTermRecommender,
        }),
        relevanceSorter: new ParsedEntrySorter(),
      }),
      matchPipelineFactory: new MatchPipelineFactory({
        parser: new Edict2LikeParser({
          glossParser,
        }),
      }),
      matchesPipelineFactory: new MatchesPipelineFactory({
        matcher: new Edict2LikeMatcher({
          text: edict2Text,
          escapeRegExp,
        }),
      }),
    });
  }
}

export class DictionariesFactory {
	construct({
		edict2,
		enamdict,
	}) {
    return new Dictionaries({
      dictionaries: {
        edict2,
        enamdict,
      },
    });
	}
}