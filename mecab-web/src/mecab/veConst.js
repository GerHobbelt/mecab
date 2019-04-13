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

export const Pos = {
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

export const Grammar = {
  Auxiliary: 'Auxiliary',
  Nominal: 'Nominal',
  Unassigned: 'Unassigned',
};

export const Const = {
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
PRONUNCIATION = 8; // pronunciation

Token#getAllFeaturesArray()[POS1]
mecabToken.partOfSpeech
*/