import { Pos, Grammar, Const } from './veConst.js';

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

export class Word {
  constructor({
    reading,
    pronunciation,
    grammar,
    lemma,
    partOfSpeechVe,
    surfaceLayerForm,
    token,
  }) {
    this._reading = reading;
    this._pronunciation = pronunciation;
    this._grammar = grammar;
    this._lemma = lemma; // "聞く"
    this._partOfSpeechVe = partOfSpeechVe; // eg. Pos.Noun
    this._surfaceLayerForm = surfaceLayerForm; // "聞かせられ"
    this._token = token;

    this._tokens = [token];
  }

  set partOfSpeechVe(value) {
    this._partOfSpeechVe = value;
  }

  get partOfSpeechVe() {
    return this._partOfSpeechVe;
  }

  get tokens() {
    return this._tokens;
  }

  get surfaceLayerForm() {
    return this._surfaceLayerForm;
  }

  get lemma() {
    return this._lemma;
  }

  toString() {
    return this._surfaceLayerForm;
  }

  addToken(token) {
    this._tokens.push(token);
  }

  appendToSurfaceLayerForm(suffix) {
    if (this._surfaceLayerForm === undefined) {
      this._surfaceLayerForm = "_"; // likely won't experience a null word, actually.
    }
    this._surfaceLayerForm += suffix;
  }

  appendToReading(suffix) {
    if (this._reading === undefined) {
      this._reading = "_";
    }
    this._reading += suffix;
  }

  appendToPronunciation(suffix) {
    if (this._pronunciation === undefined) {
      this._pronunciation = "_";
    }
    this._pronunciation += suffix;
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
      let eatNext = false,
      eatLemma = true,
      attachToPrevious = false,
      alsoAttachToLemma = false,
      updatePos = false,
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
                    eatNext = true;
                    break;
                  case Const.TOKUSHU_DA:
                    pos = Pos.Adjective;
                    // Using inflectionForm as in Ruby script, whereas Java used partOfSpeechSubclass1
                    // https://github.com/Kimtaro/ve/blob/master/lib/providers/mecab_ipadic.rb#L207
                    if (following.inflectionForm === Const.TAIGENSETSUZOKU) {
                      eatNext = true;
                      eatLemma = false;
                    }
                    break;
                  case Const.TOKUSHU_NAI:
                    pos = Pos.Adjective;
                    eatNext = true;
                    break;
                  default:
                    if (following.partOfSpeech === Const.JOSHI
                      && following.surfaceLayerForm === Const.NI) {
                      pos = Pos.Adverb; // Ve script redundantly (I think) also has eatNext = false here.  
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
                      && following.surfaceLayerForm === Const.NI){
                      pos = Pos.Adverb;
                      eatNext = false; // Changed this to false because 'case JOSHI' has 'attachToPrevious = true'.
                    }
                    break;
                  case Const.JODOUSHIGOKAN:
                    if (following.inflectionType === Const.TOKUSHU_DA){
                      pos = Pos.Verb;
                      grammar = Grammar.Auxiliary;
                      if (following.inflectionForm === Const.TAIGENSETSUZOKU) {
                        eatNext = true;
                      }
                    } else if (following.partOfSpeech === 'JOSHI'
                      && following.partOfSpeechSubclass2 === Const.FUKUSHIKA){
                      pos = Pos.Adverb;
                      eatNext = true;
                    }
                    break;
                  case Const.KEIYOUDOUSHIGOKAN:
                    pos = Pos.Adjective;
                    // TODO: Java version called both of these inflectionType, but Ruby version calls the latter inflectionForm
                    if ((following.inflectionType === Const.TOKUSHU_DA
                      && following.inflectionForm === Const.TAIGENSETSUZOKU)
                      || following.partOfSpeechSubclass1 === Const.RENTAIKA) {
                      eatNext = true;
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
                && acc.wordList[acc.wordList.length-1].partOfSpeechVe === Pos.Number){
                attachToPrevious = true;
                alsoAttachToLemma = true;
              }
              break;
            case Const.SETSUBI:
              // Refers to line 267.
              if (current.partOfSpeechSubclass2 === Const.JINMEI) {
                pos = Pos.Suffix;
              } else {
                if (current.partOfSpeechSubclass2 === Const.TOKUSHU
                  && current.lemma === Const.SA){
                  updatePos = true;
                  pos = Pos.Noun;
                } else {
                  alsoAttachToLemma = true;
                }
                attachToPrevious = true;
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
            attachToPrevious = true;
          } else if (current.inflectionType === Const.FUHENKAGATA
            && current.lemma === Const.NN) {
            attachToPrevious = true;
          } else if (
            // TODO: Java version overlooks logical operator precedence; using Ruby version
            [
            Const.TOKUSHU_DA,
            Const.TOKUSHU_DESU,
            ].includes(current.inflectionType)
            && current.surfaceLayerForm !== Const.NA) {
              pos = Pos.Verb;
            }
          break;
        case Const.DOUSHI:
          // Refers to line 299.
          pos = Pos.Verb;
          switch (current.partOfSpeechSubclass1){
            case Const.SETSUBI:
              attachToPrevious = true;
              break;
            case Const.HIJIRITSU:
              if (current.inflectionForm !== Const.MEIREI_I) {
                attachToPrevious = true;
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
            && qualifyingList2.includes(current.surfaceLayerForm)
            // || current.surfaceLayerForm === Const.NI
            ) {
              attachToPrevious = true;
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
        if (token[feature] === undefined) {
          return '*';
        }
        return token[feature];
      };

      if (attachToPrevious && acc.wordList.length){
        const finalWord = acc.wordList[acc.wordList.length-1];
        // these sometimes try to add to null readings.
        finalWord.addToken(current);
        finalWord.appendToSurfaceLayerForm(current.surfaceLayerForm);
        finalWord.appendToReading(getFeatureSafely(current, 'reading'));
        finalWord.appendToPronunciation(getFeatureSafely(current, 'pronunciation'));
        if (alsoAttachToLemma) {
          finalWord.appendToLemma(current.lemma);
        }
        if (updatePos) {
          finalWord.partOfSpeechVe = pos;
        }
      } else {
        const word = new Word({
          reading: current.reading,
          pronunciation: current.pronunciation,
          grammar,
          lemma: current.lemma,
          partOfSpeechVe: pos,
          surfaceLayerForm: current.surfaceLayerForm,
          token: current,
        });
        if (eatNext){
          if (i === tokenArray.length-1) {
            throw new Error("There's a path that allows array overshooting.");
          }
          const following = tokenArray[i+1];
          word.addToken(following);
          word.appendToSurfaceLayerForm(following.surfaceLayerForm);
          word.appendToReading(following.reading);
          word.appendToPronunciation(getFeatureSafely(following, 'pronunciation'));
          if (eatLemma) {
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
      wordList: [],
    }).wordList;
	}
}