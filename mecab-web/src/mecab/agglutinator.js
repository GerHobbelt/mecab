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
};

const Etc = {
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
    partOfSpeech,
    nodeStr,
    token,
  }) {
    this._read = read;
    this._pronunciation = pronunciation;
    this._grammar = grammar;
    this._basic = basic;
    this._partOfSpeech = partOfSpeech;
    this._nodeStr = nodeStr;
    this._token = token;
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
          if(partOfSpeechSubclass1 === Const.NO_DATA) break;
          switch(partOfSpeechSubclass1) {
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
              if(current.partOfSpeechSubclass2 === Const.NO_DATA) break;
              if(i === tokenArray.length-1) break; // protects against array overshooting.
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
                  if(following.inflectionForm === Const.TAIGENSETSUZOKU) {
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
              break;

          }
      }

      if (eat_next) {
        // return {
        //   ...acc,
        //   prev: current,
        //   tokens: [...acc.tokens, ],
        // };
      }
      return {
        ...acc,
        prev: current,
      }
    }, {
      prev: undefined,
      following: undefined,
      final: tokens[tokens.length-1],
      tokens: [],
    });
	}
}