export class Edict2LikeMatcher {
  constructor({
    text,
    escapeRegExp,
  }) {
    this._text = text;
    this._escapeRegExp = escapeRegExp;
  }

  _buildRegex(term) {
    return new RegExp(
    `^(.*(^|[\\[;])${
      this._escapeRegExp(term)
    }[\\]\\(; ].*)$`, 'mg');
  }

  match(term) {
    const regexp = this._buildRegex(term);
    return this._text.match(regexp) || [];
  }
}

// export class ParserFactory {
//   constructor({
//     readingRankerFactory,
//     glossParser,
//   }) {
//     this._readingRankerFactory = readingRankerFactory;
//     this._glossParser = glossParser;
//   }

//   construct(mecabToken) {
//     return new Parser({
//       readingRanker: this._readingRankerFactory.construct(mecabToken),
//       glossParser: this._glossParser,
//     })
//   }
// }

export class Edict2LikeParser {
  constructor({
    glossParser,
  }) {
    this._glossParser = glossParser;
  }

  _parseTags(tagsSection) {
    const tagMatcher = /\(([^\(\)]*)\)/g;
    const kanji = [];
    const reading = [];
    const misc = [];
    let partOfSpeechSegment;
    let priorityEntry = false;
    while (partOfSpeechSegment = tagMatcher.exec(tagsSection)) {
      const tagContent = partOfSpeechSegment[1];
      if (tagContent === 'P') {
        priorityEntry = true;
      } else if (tagContent in edictAbbr.kanji) {
        kanji.push(tagContent);
      } else if (tagContent in edictAbbr.reading) {
        reading.push(tagContent);
      } else {
        misc.push(partOfSpeechSegment[1]);
      }
    }
    return {
      kanji,
      reading,
      misc,
      priorityEntry,
    }
  }

  _parseEntry(entry) {
    const [whole, form, tagsSection] = /([^\(\)]*)(.*)/.exec(entry);
    return {
      form,
      tags: this._parseTags(tagsSection),
    };
  }

  _parseEntrySection(section) {
    const entries = section.split(';');
    return entries.map(entry => this._parseEntry(entry));
  }

  parseEdictLine(line) {
    // console.log(line);
    const [indexSection, meaningSection] = line.split('/', 2);
    const [headwordSection, readingSection] = indexSection.split(' ', 2);
    
    const headwords = this._parseEntrySection(headwordSection);

    let readings = [];
    const readingSectionInner = /^\[(.*)\]$/.exec(readingSection);
    if (readingSectionInner && readingSectionInner.length > 1) {
      readings = this._parseEntrySection(readingSectionInner[1]);
    }

    return {
      line,
      headwords,
      readings,
      meaning: this._glossParser.parse(meaningSection),
    };
  }
}