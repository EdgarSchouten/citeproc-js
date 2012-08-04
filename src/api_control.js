/*
 * Copyright (c) 2009, 2010, 2011 and 2012 Frank G. Bennett, Jr. All Rights
 * Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 1.13, 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./tests subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009, 2010, 2011, and 2012 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Affero General Public License (the [AGPLv3]
 * License), in which case the provisions of [AGPLv3] License are
 * applicable instead of those above. If you wish to allow use of your
 * version of this file only under the terms of the [AGPLv3] License
 * and not to allow others to use your version of this file under the
 * CPAL, indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by the
 * [AGPLv3] License. If you do not delete the provisions above, a
 * recipient may use your version of this file under either the CPAL
 * or the [AGPLv3] License.”
 */

/*global CSL: true */

CSL.Engine.prototype.setOutputFormat = function (mode) {
    this.opt.mode = mode;
    this.fun.decorate = CSL.Mode(mode);
    if (!this.output[mode]) {
        this.output[mode] = {};
        this.output[mode].tmp = {};
    }
};

CSL.Engine.prototype.setLangTagsForCslSort = function (tags) {
    var i, ilen;
    if (tags) {
        this.opt['locale-sort'] = [];
        for (i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-sort'].push(tags[i]);
        }
    }
};
    
CSL.Engine.prototype.setLangTagsForCslTransliteration = function (tags) {
    var i, ilen;
    this.opt['locale-translit'] = [];
    if (tags) {
        for (i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-translit'].push(tags[i]);
        }
    }
};
    
CSL.Engine.prototype.setLangTagsForCslTranslation = function (tags) {
    var i, ilen;
    this.opt['locale-translat'] = [];
    if (tags) {
        for (i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-translat'].push(tags[i]);
        }
    }
};

CSL.Engine.prototype.setLangPrefsForCites = function (obj, conv) {
    var opt = this.opt['cite-lang-prefs'];
    if (!conv) {
        conv = function (key) {
            return key.toLowerCase();
        };
    }
    var segments = ['Persons', 'Institutions', 'Titles', 'Publishers', 'Places'];
    // Set values in place
    for (var i = 0, ilen = segments.length; i < ilen; i += 1) {
        var clientSegment = conv(segments[i]);
        var citeprocSegment = segments[i].toLowerCase();
        if (!obj[clientSegment]) {
            continue;
        }
        //
        // Normalize the sequence of secondary and tertiary
        // in the provided obj segment list.
        //
        var supplements = [];
        while (obj[clientSegment].length > 1) {
            supplements.push(obj[clientSegment].pop());
        }
        var sortval = {orig:1,translit:2,translat:3};
        if (supplements.length === 2 && sortval[supplements[0]] < sortval[supplements[1]]) {
            supplements.reverse();
        }
        while (supplements.length) {
            obj[clientSegment].push(supplements.pop());
        }
        //
        // normalization done.
        //
        var lst = opt[citeprocSegment];
        while (lst.length) {
            lst.pop();
        }
        for (var j = 0, jlen = obj[clientSegment].length; j < jlen; j += 1) {
            lst.push(obj[clientSegment][j]);
        }
    }
};

CSL.Engine.prototype.setLangPrefsForCiteAffixes = function (affixList) {
    if (affixList && affixList.length === 40) {
        var affixes = this.opt.citeAffixes;
        var count = 0;
        var settings = ["persons", "institutions", "titles", "publishers", "places"];
        var forms = ["translit", "orig", "translit", "translat"];
        var value;
        for (var i = 0, ilen = settings.length; i < ilen; i += 1) {
            for (var j = 0, jlen = forms.length; j < jlen; j += 1) {
                value = "";
                if ((count % 8) === 4) {
                    if (!affixes[settings[i]]["locale-"+forms[j]].prefix
                        && !affixes[settings[i]]["locale-"+forms[j]].suffix) {

                        value = affixList[count] ? affixList[count] : "";
                        affixes[settings[i]]["locale-" + forms[j]].prefix = value;
                        value = affixList[count] ? affixList[count + 1] : "";
                        affixes[settings[i]]["locale-" + forms[j]].suffix = value;
                    }
                } else {
                    value = affixList[count] ? affixList[count] : "";
                    affixes[settings[i]]["locale-" + forms[j]].prefix = value;
                    value = affixList[count] ? affixList[count + 1] : "";
                    affixes[settings[i]]["locale-" + forms[j]].suffix = value;
                }
                count += 2;
            }
        }
        this.opt.citeAffixes = affixes;
    }
};

CSL.Engine.prototype.setAutoVietnameseNamesOption = function (arg) {
    if (arg) {
        this.opt["auto-vietnamese-names"] = true;
    } else {
        this.opt["auto-vietnamese-names"] = false;
    }
};

CSL.Engine.prototype.setAbbreviations = function (arg) {
    if (this.sys.setAbbreviations) {
        this.sys.setAbbreviations(arg);
    }
};

CSL.Engine.prototype.setEnglishLocaleEscapes = function (arg) {
    if ("string" === typeof arg) {
        arg = arg.split(/\s+,\s+/);
    }
    if (!arg || !arg.length) {
        arg = [];
    }
    for (var i = 0, ilen = arg.length; i < ilen; i += 1) {
        if (this.opt.english_locale_escapes.indexOf(arg[i]) === -1) {
            this.opt.english_locale_escapes.push(arg[i]);
        }
    }
};


