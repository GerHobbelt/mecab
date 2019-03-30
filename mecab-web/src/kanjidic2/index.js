/** @author bobince
  * @see https://stackoverflow.com/a/3561711/5257399 */
function regExpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function kanjidic2Lookup(kanjidic2Text, kanji) {
  const firstMatch = kanjidic2Text.match(new RegExp(`^${regExpEscape(kanji)}.*$`, 'm'));
  if (!firstMatch) {
    return undefined;
  }
  return firstMatch[0];
}

function parseKanjidic2Entry(line) {
  const [kanji, miscSection, rmgroupsSection, nanoriSection] = line.split('$');
  const nanoris = nanoriSection.split('|');
  const rmgroups = rmgroupsSection.split('^')
  .map(rmgroupSection => {
    const [onSection, kunSection, meaningSection] = rmgroupSection.split('`');
    const ons = onSection.split('|');
    const kuns = kunSection.split('|')
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
    const meanings = meaningSection.split('|');
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

export {
  kanjidic2Lookup,
  parseKanjidic2Entry,
}