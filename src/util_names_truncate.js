/*
 * Copyright (c) 2009, 2010 and 2011 Frank G. Bennett, Jr. All Rights
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
 * Sections 14 and 15 have been added to cover use of software over a
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
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009, 2010 and 2011 Frank G. Bennett, Jr. All Rights Reserved.
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

CSL.NameOutput.prototype.truncatePersonalNameLists = function () {
    var v, i, ilen, j, jlen, chopvar, values;
    // XXX Before truncation, make a note of the original number
    // of names, for use in et-al evaluation.
    this.freeters_count = {};
    this.persons_count = {};
    this.institutions_count = {};
    // By key is okay here, as we don't care about sequence.
    for (v in this.freeters) {
        if (this.freeters.hasOwnProperty(v)) {
            this.freeters_count[v] = this.freeters[v].length;
            this.freeters[v] = this._truncateNameList(this.freeters, v);
        }
    }

    for (v in this.persons) {
        if (this.persons.hasOwnProperty(v)) {
            this.institutions_count[v] = this.institutions[v].length;
            this._truncateNameList(this.institutions, v);
            this.persons[v] = this.persons[v].slice(0, this.institutions[v].length);
            this.persons_count[v] = [];
            for (j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
                this.persons_count[v][j] = this.persons[v][j].length;
                this.persons[v][j] = this._truncateNameList(this.persons, v, j);
            }
        }
    }
    // Could be factored out to a separate function for clarity.
    if (this.etal_min === 1 && this.etal_use_first === 1 
        && !(this.state.tmp.extension
             || this.state.tmp.just_looking)) {
        chopvar = v;
    } else {
        chopvar = false;
    }
    if (chopvar || this._please_chop) {
        for (i = 0, ilen = this.variables.length; i < ilen; i += 1) {
            v = this.variables[i];
            if (this.freeters[v].length) {
                if (this._please_chop === v) {
                    this.freeters[v] = this.freeters[v].slice(1);
                    this.freeters_count[v] += -1;
                    this._please_chop = false;
                } else if (chopvar && !this._please_chop) {
                    this.freeters[v] = this.freeters[v].slice(0, 1);
                    this.freeters_count[v] = 1;
                    this.institutions[v] = [];
                    this.persons[v] = [];
                    this._please_chop = chopvar;
                }
            }
            for (i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
                if (this.persons[v][i].length) {
                    if (this._please_chop === v) {
                        this.persons[v][i] = this.persons[v][i].slice(1);
                        this.persons_count[v][i] += -1;
                        this._please_chop = false;
                        break;
                    } else if (chopvar && !this._please_chop) {
                        this.freeters[v] = this.persons[v][i].slice(0, 1);
                        this.freeters_count[v] = 1;
                        this.institutions[v] = [];
                        this.persons[v] = [];
                        values = [];
                        this._please_chop = chopvar;
                        break;
                    }
                }
            }
            if (this.institutions[v].length) {
                if (this._please_chop === v) {
                    this.institutions[v] = this.institutions[v].slice(1);
                    this.institutions_count[v] += -1;
                    this._please_chop = false;
                } else if (chopvar && !this._please_chop) {
                    this.institutions[v] = this.institutions[v].slice(0, 1);
                    this.institutions_count[v] = 1;
                    values = [];
                    this._please_chop = chopvar;
                }
            }
        }
    }

    // Transliteration and abbreviation mapping
    for (v in this.freeters) {
        this._transformNameset(this.freeters[v]);
    }
    for (v in this.persons) {
        for (i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
            this._transformNameset(this.persons[v][i]);
        }
        this._transformNameset(this.institutions[v]);
    }

    // Could also be factored out to a separate function for clarity.
    for (i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        if (this.institutions[v].length) {
            this.nameset_offset += 1;
        }
        for (i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
            if (this.persons[v][i].length) {
                this.nameset_offset += 1;
            }
            this.institutions[v][i] = this._splitInstitution(this.institutions[v][i], v, i);
        }
    }

    // Finally, apply any registered institution name abbreviations to the
    // (possibly transliterated) name form.
    for (v in this.institutions) {
        for (i = 0, ilen = this.institutions[v].length; i < ilen; i += 1) {
            // XXX Hack alert. Entries managed by an Abbreviations plugin
            // can break the parsing here, so we need to be sure the lengths
            // of the splits match.
            var long_form = this.institutions[v][i]["long"];
            var short_form = long_form.slice();
            if (this.state.sys.getAbbreviation) {
                var jurisdiction = this.Item.jurisdiction;
                for (var j = 0, jlen = long_form.length; j < jlen; j += 1) {
                    var jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-part", long_form[j]);
                    if (this.state.transform.abbrevs[jurisdiction]["institution-part"][long_form[j]]) {
                        short_form[j] = this.state.transform.abbrevs[jurisdiction]["institution-part"][long_form[j]];
                    }
                }
            }
            this.institutions[v][i]["short"] = short_form;
        }
    }
};

CSL.NameOutput.prototype._truncateNameList = function (container, variable, index) {
    var lst;
    if ("undefined" === typeof index) {
        lst = container[variable];
    } else {
        lst = container[variable][index];
    }
    if (this.state.opt.max_number_of_names 
        && lst.length > 50 
        && lst.length > (this.state.opt.max_number_of_names + 2)) {
        
        lst = lst.slice(0, this.state.opt.max_number_of_names + 2);
    }
    return lst;
};

CSL.NameOutput.prototype._splitInstitution = function (value, v, i) {
    var ret = {};
    var splitInstitution = value.literal.replace(/\s*\|\s*/g, "|");
    // check for total and utter abbreviation IFF form="short"
    splitInstitution = splitInstitution.split("|");
    if (this.institution.strings.form === "short" && this.state.sys.getAbbreviation) {
        // End processing before processing last single element, since
        // that will be picked up by normal element selection and
        // short-forming.
        var jurisdiction = this.Item.jurisdiction;
        for (var j = splitInstitution.length; j > 1; j += -1) {
            var str = splitInstitution.slice(0, j).join("|");
            var jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-entire", str);
            if (this.state.transform.abbrevs[jurisdiction]["institution-entire"][str]) {
                str = this.state.transform.abbrevs[jurisdiction]["institution-entire"][str];
                splitInstitution = [str].concat(splitInstitution.slice(j));
            }
        }
    }
    splitInstitution.reverse();
    ret["long"] = this._trimInstitution(splitInstitution, v, i);

    if (splitInstitution.length) {
        // This doesn't seem to make any sense.
        //ret["short"] = this._trimInstitution(splitInstitution, v, i);
        ret["short"] = ret["long"].slice();
    } else {
        ret["short"] = false;
    }
    return ret;
};

CSL.NameOutput.prototype._trimInstitution = function (subunits, v, i) {
	// 
    var use_first = false;
    var append_last = false;
    var stop_last = false;
    var s = subunits.slice();
    if (this.institution) {
        if ("undefined" !== typeof this.institution.strings["use-first"]) {
            use_first = this.institution.strings["use-first"];
        }
        if ("undefined" !== typeof this.institution.strings["stop-last"]) {
            // stop-last is negative when present
            s = s.slice(0, this.institution.strings["stop-last"]);
        }
        if ("undefined" !== typeof this.institution.strings["use-last"]) {
            append_last = this.institution.strings["use-last"];
        }
    }
    if (false === use_first) {
        if (this.persons[v][i].length === 0) {
            use_first = this.institution.strings["substitute-use-first"];
        }
        if (!use_first) {
            use_first = 0;
        }
    }
    if (false === append_last) {
        if (!use_first) {
            append_last = subunits.length;
        } else {
            append_last = 0;
        }
    }
    // Now that we've determined the value of append_last
    // (use-last), avoid overlaps.
    if (use_first > subunits.length - append_last) {
        use_first = subunits.length - append_last;
    }
    if (stop_last) {
        append_last = 0;
    }
    // This could be more clear. use-last takes priority
    // in the event of overlap, because of adjustment above
    subunits = subunits.slice(0, use_first);
    s = s.slice(use_first);
    if (append_last) {
        if (append_last > s.length) {
            append_last = s.length;
        }
        if (append_last) {
            subunits = subunits.concat(s.slice((s.length - append_last)));
        }
    }
    return subunits;
};
