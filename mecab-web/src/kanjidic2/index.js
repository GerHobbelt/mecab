export class Kanjidic2 {
  constructor({
    kanjidic2Text,
    regExpEscape,
  }) {
    this.kanjidic2Text = kanjidic2Text;
    this.regExpEscape = regExpEscape;
  }

  lookup(kanji) {
    const firstMatch = this.kanjidic2Text.match(new RegExp(`^${this.regExpEscape(kanji)}.*$`, 'm'));
    if (!firstMatch) {
      return undefined;
    }
    return firstMatch[0];
  }

  parse(line) {
    const [kanji, jlptLevel, rmgroupsSection, nanoriSection] = line.split('$');
    const nanoris = nanoriSection
    ? nanoriSection.split('^')
    : []
    const rmgroups = (rmgroupsSection
    ? rmgroupsSection.split('^')
    : [])
    .map(rmgroupSection => {
      const [onSection, kunSection, meaningSection] = rmgroupSection.split('`');
      const ons = onSection
      ? onSection.split('|')
      : []
      const kuns = (kunSection
      ? kunSection.split('|')
      : [])
      .map(kun => {
        // '-ど.り'
        const [,isSuffix,reading,okurigana,isPrefix]
        = /^(-?)([^.-]*)\.?([^.-]*)(-?)$/.exec(kun);
        return {
          isSuffix,
          reading,
          okurigana,
          isPrefix,
        };
      });
      if (!meaningSection) {
        console.warn(line)
      }
      const meanings = meaningSection
      ? meaningSection.split('|')
      : []
      return {
        ons,
        kuns,
        meanings,
        nanoris,
      }
    });

    if (!rmgroups.length) {
      console.warn(`No rmgroups detected for kanji '${kanji}'. Giving empty result.`)
      return {
        ons: [],
        kuns: [],
        meanings: [],
        nanoris,
      }
    }
    if (rmgroups.length > 1) {
      console.warn(`Multiple rmgroups (${rmgroups.length}) detected for kanji '${kanji}'. Reading first only.`)
    }
    return rmgroups[0];
  }
}
