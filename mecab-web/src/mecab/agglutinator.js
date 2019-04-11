/**
  * This file contains code ported from Kim Ahlström's Ve (MIT License).
  * https://github.com/Kimtaro/ve
  *
  * What follows is the text of the MIT License under which Kim Ahlström's
  * original code was published:
  *
  * The MIT License (MIT)
  * Copyright © 2015 Kim Ahlström <kim.ahlstrom@gmail.com>
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the “Software”), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */
const Pos = {
  Noun: 'Noun',
  ProperNoun: 'ProperNoun',
  Pronoun: 'Pronoun',
  Adjective: 'Adjective',
  Adverb: 'Adverb',
  Determiner: 'Determiner',
  Preposition: 'Preposition',
  Postposition: 'Postposition',
  Verb: 'Verb',
  Suffix: 'Suffix',
  Prefix: 'Prefix',
  Conjunction: 'Conjunction',
  Interjection: 'Interjection',
  Number: 'Number',
  Unknown: 'Unknown',
  Symbol: 'Symbol',
  Other: 'Other',
  TBD: 'TBD',
};

const Grammar = {
  Auxiliary: 'Auxiliary',
  Nominal: 'Nominal',
  Unassigned: 'Unassigned',
};

const Const = {
  // POS1
  MEISHI: '名詞',
  KOYUUMEISHI: '固有名詞',
  DAIMEISHI: '代名詞',
  JODOUSHI: '助動詞',
  KAZU: '数',
  JOSHI: '助詞',
  SETTOUSHI: '接頭詞',
  DOUSHI: '動詞',
  KIGOU: '記号',
  FIRAA: 'フィラー',
  SONOTA: 'その他',
  KANDOUSHI: '感動詞',
  RENTAISHI: '連体詞',
  SETSUZOKUSHI: '接続詞',
  FUKUSHI: '副詞',
  SETSUZOKUJOSHI: '接続助詞',
  KEIYOUSHI: '形容詞',
  MICHIGO: '未知語',

  // POS2_BLACKLIST and inflection types
  HIJIRITSU: '非自立',
  FUKUSHIKANOU: '副詞可能',
  SAHENSETSUZOKU: 'サ変接続',
  KEIYOUDOUSHIGOKAN: '形容動詞語幹',
  NAIKEIYOUSHIGOKAN: 'ナイ形容詞語幹',
  JODOUSHIGOKAN: '助動詞語幹',
  FUKUSHIKA: '副詞化',
  TAIGENSETSUZOKU: '体言接続',
  RENTAIKA: '連体化',
  TOKUSHU: '特殊',
  SETSUBI: '接尾',
  SETSUZOKUSHITEKI: '接続詞的',
  DOUSHIHIJIRITSUTEKI: '動詞非自立的',
  SAHEN_SURU: 'サ変・スル',
  TOKUSHU_TA: '特殊・タ',
  TOKUSHU_NAI: '特殊・ナイ',
  TOKUSHU_TAI: '特殊・タイ',
  TOKUSHU_DESU: '特殊・デス',
  TOKUSHU_DA: '特殊・ダ',
  TOKUSHU_MASU: '特殊・マス',
  TOKUSHU_NU: '特殊・ヌ',
  FUHENKAGATA: '不変化型',
  JINMEI: '人名',
  MEIREI_I: '命令ｉ',
  KAKARIJOSHI: '係助詞',
  KAKUJOSHI: '格助詞',

  NO_DATA: '*',

  // etc
  NA: 'な',
  NI: 'に',
  TE: 'て',
  DE: 'で',
  BA: 'ば',
  NN: 'ん',
  SA: 'さ',
};

// const mecab
/*
POS1 = 0;  // partOfSpeech
POS2 = 1;  // partOfSpeechSubclass1
POS3 = 2;  // partOfSpeechSubclass2
POS4 = 3;  // partOfSpeechSubclass3
CTYPE = 4; // inflectionType
CFORM = 5; // inflectionForm
BASIC = 6; // lemma
READING = 7; // reading
PRONUNCIATION = 8; // pronunication

Token#getAllFeaturesArray()[POS1]
mecabToken.partOfSpeech
*/

export class Word {
  constructor({
    read,
    pronunciation,
    grammar,
    basic,
    part_of_speech,
    nodeStr,
    token,
  }) {
    this._reading = read;
    this._transcription = pronunciation;
    this._grammar = grammar;
    this._lemma = basic; // "聞く"
    this._part_of_speech = part_of_speech; // eg. Pos.Noun
    this._word = nodeStr; // "聞かせられ"
    this._token = token;
    
    this._tokens = [token];
  }

  set part_of_speech(value) {
    this._part_of_speech = value;
  }

  get part_of_speech() {
    return this._part_of_speech;
  }

  get tokens() {
    return this._tokens;
  }

  get word() {
    return this._word;
  }

  get lemma() {
    return this._lemma;
  }

  toString() {
    return this._word;
  }

  addToken(token) {
    this._tokens.push(token);
  }

  appendToWord(suffix) {
    if (this._word === undefined) {
      this._word = "_"; // likely won't experience a null word, actually.
    }
    this._word += suffix;
  }

  appendToReading(suffix) {
    if (this._reading === undefined) {
      this._reading = "_";
    }
    this._reading += suffix;
  }

  appendToTranscription(suffix) {
    if (this._transcription === undefined) {
      this._transcription = "_";
    }
    this._transcription += suffix;
  }

  appendToLemma(suffix) {
    if (this._lemma === undefined) {
      this._lemma = "_";
    }
    this._lemma += suffix;
  }
}

export class MecabTokenAgglutinator {
	agglutinate(mecabTokens) {
    return mecabTokens.reduce((acc, current, i, tokenArray) => {
      let eat_next = false,
      eat_lemma = true,
      attach_to_previous = false,
      also_attach_to_lemma = false,
      update_pos = false,
      grammar = Grammar.Unassigned,
      pos = undefined; // or TBD

      switch (current.partOfSpeech) {
        case Const.MEISHI:
        // case Const.MICHIGO:
          pos = Pos.Noun;
          if (current.partOfSpeechSubclass1 === Const.NO_DATA) break;
          switch(current.partOfSpeechSubclass1) {
            case Const.KOYUUMEISHI:
              pos = Pos.ProperNoun;
              break;
            case Const.DAIMEISHI:
              pos = Pos.Pronoun;
              break;
            case Const.FUKUSHIKANOU:
            case Const.SAHENSETSUZOKU:
            case Const.KEIYOUDOUSHIGOKAN:
            case Const.NAIKEIYOUSHIGOKAN:
              // Refers to line 213 of Ve.
              // TODO: is this guard really needed?
              if (current.partOfSpeechSubclass2 === Const.NO_DATA) break;
              if (i === tokenArray.length-1) break; // protects against array overshooting.

              {
                const following = tokenArray[i+1];
                switch(following.utilizationType){
                  case Const.SAHEN_SURU:
                    pos = Pos.Verb;
                    eat_next = true;
                    break;
                  case Const.TOKUSHU_DA:
                    pos = Pos.Adjective;
                    // Using inflectionForm as in Ruby script, whereas Java used partOfSpeechSubclass1
                    // https://github.com/Kimtaro/ve/blob/master/lib/providers/mecab_ipadic.rb#L207
                    if (following.inflectionForm === Const.TAIGENSETSUZOKU) {
                      eat_next = true;
                      eat_lemma = false;
                    }
                    break;
                  case Const.TOKUSHU_NAI:
                    pos = Pos.Adjective;
                    eat_next = true;
                    break;
                  default:
                    if (following.partOfSpeech === Const.JOSHI
                      && following.surfaceForm === Const.NI) {
                      pos = Pos.Adverb; // Ve script redundantly (I think) also has eat_next = false here.  
                    }
                    break;
                }
              }
              break;
            case Const.HIJIRITSU:
            case Const.TOKUSHU:
              // Refers to line 233 of Ve.
              if (current.partOfSpeechSubclass2 === Const.NO_DATA) break;
              if (i === tokenArray.length-1) break; // protects against array overshooting.

              {
                const following = tokenArray[i+1];
                switch(current.partOfSpeechSubclass2){
                  case Const.FUKUSHIKANOU:
                    if (following.partOfSpeech === Const.JOSHI
                      && following.surfaceForm === Const.NI){
                      pos = Pos.Adverb;
                      eat_next = false; // Changed this to false because 'case JOSHI' has 'attach_to_previous = true'.
                    }
                    break;
                  case Const.JODOUSHIGOKAN:
                    if (following.inflectionType === Const.TOKUSHU_DA){
                      pos = Pos.Verb;
                      grammar = Grammar.Auxiliary;
                      if (following.inflectionForm === Const.TAIGENSETSUZOKU) {
                        eat_next = true;
                      }
                    } else if (following.partOfSpeech === 'JOSHI'
                      && following.partOfSpeechSubclass2 === Const.FUKUSHIKA){
                      pos = Pos.Adverb;
                      eat_next = true;
                    }
                    break;
                  case Const.KEIYOUDOUSHIGOKAN:
                    pos = Pos.Adjective;
                    // TODO: Java version called both of these inflectionType, but Ruby version calls the latter inflectionForm
                    if ((following.inflectionType === Const.TOKUSHU_DA
                      && following.inflectionForm === Const.TAIGENSETSUZOKU)
                      || following.partOfSpeechSubclass1 === Const.RENTAIKA) {
                      eat_next = true;
                    }
                    break;
                  default:
                    break;
                }
              }
              break;
            case Const.KAZU:
              // TODO: "recurse and find following numbers and add to this word. Except non-numbers like 幾"
              // Refers to line 261.
              pos = Pos.Number;
              if (acc.wordList.length
                && acc.wordList[acc.wordList.length-1].partOfSpeech === Pos.Number){
                attach_to_previous = true;
                also_attach_to_lemma = true;
              }
              break;
            case Const.SETSUBI:
              // Refers to line 267.
              if (current.partOfSpeechSubclass2 === Const.JINMEI) {
                pos = Pos.Suffix;
              } else {
                if (current.partOfSpeechSubclass2 === Const.TOKUSHU
                  && current.lemma === Const.SA){
                  update_pos = true;
                  pos = Pos.Noun;
                } else {
                  also_attach_to_lemma = true;
                }
                attach_to_previous = true;
              }
              break;
            case Const.SETSUZOKUSHITEKI:
              pos = Pos.Conjunction;
              break;
            case Const.DOUSHIHIJIRITSUTEKI:
              pos = Pos.Verb;
              grammar = Grammar.Nominal; // not using.
              break;
            default:
              // Keep Pos as Noun, as it currently is.
              break;
          }
          break;
        case Const.SETTOUSHI:
          // TODO: "elaborate this when we have the "main part" feature for words?"
          pos = Pos.Prefix;
          break;
        case Const.JODOUSHI:
          // Refers to line 290.
          pos = Pos.Postposition;
          const qualifyingList1 = [
          Const.TOKUSHU_TA,
          Const.TOKUSHU_NAI,
          Const.TOKUSHU_TAI,
          Const.TOKUSHU_MASU,
          Const.TOKUSHU_NU,
          ];
          if (acc.previous === undefined
            || acc.previous.partOfSpeechSubclass1 !== Const.KAKARIJOSHI
            && qualifyingList1.includes(current.inflectionType)) {
            attach_to_previous = true;
          } else if (current.inflectionType === Const.FUHENKAGATA
            && current.lemma === Const.NN) {
            attach_to_previous = true;
          } else if (
            // TODO: Java version overlooks logical operator precedence; using Ruby version
            [
            Const.TOKUSHU_DA,
            Const.TOKUSHU_DESU,
            ].includes(current.inflectionType)
            && current.surfaceForm !== Const.NA) {
              pos = Pos.Verb;
            }
          break;
        case Const.DOUSHI:
          // Refers to line 299.
          pos = Pos.Verb;
          switch (current.partOfSpeechSubclass1){
            case Const.SETSUBI:
              attach_to_previous = true;
              break;
            case Const.HIJIRITSU:
              if (current.inflectionForm !== Const.MEIREI_I) {
                attach_to_previous = true;
              }
            default:
              break;
          }
          break;
        case Const.KEIYOUSHI:
          pos = Pos.Adjective;
          break;
        case Const.JOSHI:
          // Refers to line 309.
          pos = Pos.Postposition;
          const qualifyingList2 = [
          Const.TE,
          Const.DE,
          Const.BA,
          ];
          // Java version adds NI to this, but let's start by following Ruby version.
          if (current.partOfSpeechSubclass1 === Const.SETSUZOKUJOSHI
            && qualifyingList2.includes(current.surfaceForm)
            // || current.surfaceForm === Const.NI
            ) {
              attach_to_previous = true;
            }
          break;
        case Const.RENTAISHI:
          pos = Pos.Determiner;
          break;
        case Const.SETSUZOKUSHI:
          pos = Pos.Conjunction;
          break;
        case Const.FUKUSHI:
          pos = Pos.Adverb;
          break;
        case Const.KIGOU:
          pos = Pos.Symbol;
          break;
        case Const.FIRAA:
        case Const.KANDOUSHI:
          pos = Pos.Interjection;
          break;
        case Const.SONOTA:
          pos = Pos.Other;
          break;
        default:
          pos = Pos.TBD;
          // C'est une catastrophe
      }

      const getFeatureSafely = (token, feature) => {
        if (token.feature === undefined) {
          return '*';
        }
        return token.feature;
      };

      if (attach_to_previous && acc.wordList.length){
        const finalWord = acc.wordList[acc.wordList.length-1];
        // these sometimes try to add to null readings.
        finalWord.addToken(current);
        finalWord.appendToWord(current.surfaceForm);
        finalWord.appendToReading(getFeatureSafely(current, 'reading'));
        finalWord.appendToTranscription(getFeatureSafely(current, 'pronunciation'));
        if (also_attach_to_lemma) {
          finalWord.appendToLemma(current.lemma);
        }
        if (update_pos) {
          finalWord.part_of_speech = pos;
        }
      } else {
        const word = new Word({
          read: current.reading,
          pronunciation: current.pronunication,
          grammar,
          basic: current.lemma,
          part_of_speech: pos,
          nodeStr: current.surfaceForm,
          token: current,
        });
        if (eat_next){
          if (i === tokenArray.length-1) {
            throw new Error("There's a path that allows array overshooting.");
          }
          const following = tokenArray[i+1];
          word.addToken(following);
          word.appendToWord(following.surfaceForm);
          word.appendToReading(following.reading);
          word.appendToTranscription(getFeatureSafely(following, 'pronunciation'));
          if (eat_lemma) {
            word.appendToLemma(following.lemma);
          }
        }
        return {
          ...acc,
          wordList: [...acc.wordList, word],
          previous: current,
        }
      }

      return {
        ...acc,
        previous: current,
      }
    }, {
      previous: undefined,
      // following: undefined,
      // final: tokens[tokens.length-1],
      // tokens: [],
      wordList: [],
    }).wordList;
	}
}