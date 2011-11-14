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

/*
 * Fields can be transformed by translation/transliteration, or by
 * abbreviation.  Two levels of translation/transliteration
 * are available: primary-only (a one-to-one transform) or
 * primary+secondary (a transform resulting in two fields of
 * output, with implicit punctuation formatting).
 *
 * The primary+secondary transliteration/translation level is
 * available only with full-form fields.  Primary-only
 * transliteration/translation is available with both full-form
 * and short-form fields.  In this case, the abbreviation is
 * applied after the language transform.
 *
 * The transformation object here applies the most aggressive
 * transformation available under a given set of parameters.
 * It works only with simple string fields; multilingual
 * dates are handled by a separate mechanism, and numeric
 * fields are not subject to transformation.
 *
 * The transformed output is written directly to the output
 * queue.  This is necessary to cover the possibility of
 * two output fields with separate formatting requirements.
 *
 * This object itself returns an appropriate token function
 * with a standard interface, for use at runtime.
 *
 * Instantiation arguments:
 *   state object
 *
 * Initialization arguments
 *
 *   Required arguments
 *     default formatting token
 *     field name
 *
 *   Optional argument (used only if abbreviation is required)
 *     subsection
 *
 * Abbreviation
 *
 *   Optional setters:
 *     .setAbbreviationFallback(); fallback flag
 *       (if true, a failed abbreviation will fallback to long)
 *     .setAlternativeVariableName(): alternative variable name in Item,
 *       for use as a fallback abbreviation source
 *
 * Translation/transliteration
 *
 *   Required setter:
 *     .setTransformLocale(): mode (one of "default-locale", "locale-pri",
 *       "locale-sec" or "locale-sort")
 *
 *   Optional setter:
 *     .setTransformFallback():
 *       default flag (if true, the original field value will be used as a fallback)
 *
 *
 * The getTextSubField() method may be used to obtain a string transform
 * of a field, without abbreviation, as needed for setting sort keys
 * (for example).
 *
 */

CSL.Transform = function (state) {
    var debug = false, abbreviations, token, fieldname, subsection, opt;

    // Abbreviation subsections
    this.abbrevs = {};
    this.abbrevs["default"] = new CSL.AbbreviationSegments();

    // Initialization method
    function init(t, f, x) {
        token = t;
        fieldname = f;
        subsection = x;
        opt = {
            abbreviation_fallback: false,
            alternative_varname: false,
            transform_locale: false,
            transform_fallback: false
        };
    }
    this.init = init;

    // Internal function
    function abbreviate(state, Item, altvar, basevalue, mysubsection, use_field) {
        var value;

        if (!mysubsection) {
            return basevalue;
        }

        if (["publisher-place", "event-place"].indexOf(mysubsection) > -1) {
            mysubsection = "place";
        }

        if (["publisher", "authority"].indexOf(mysubsection) > -1) {
            mysubsection = "institution-part";
        }

        if (["genre"].indexOf(mysubsection) > -1) {
            mysubsection = "title";
        }

        if (["title-short"].indexOf(mysubsection) > -1) {
            mysubsection = "title";
        }

        // Lazy retrieval of abbreviations.
        value = "";
        if (state.sys.getAbbreviation) {
            var jurisdiction = state.transform.loadAbbreviation(Item.jurisdiction, mysubsection, basevalue);

            // XXX Need a fallback mechanism here. Other to default.
            if (state.transform.abbrevs[jurisdiction][mysubsection] && basevalue && state.sys.getAbbreviation) {
                if (state.transform.abbrevs[jurisdiction][mysubsection][basevalue]) {
                    value = state.transform.abbrevs[jurisdiction][mysubsection][basevalue];
                }
            }
        }
        if (!value && altvar && Item[altvar] && use_field) {
            value = Item[altvar];
        }
        if (!value) {
            value = basevalue;
        }
        return value;
    }

    // Internal function
    function getTextSubField(Item, field, locale_type, use_default) {
        var m, lst, opt, o, oo, pos, key, ret, len, myret, opts;
        if (!Item[field]) {
            return "";
        }
        ret = "";

        opts = state.opt[locale_type];
        if ("undefined" === typeof opts) {
            opts = state.opt["default-locale"];
        }

        for (var i = 0, ilen = opts.length; i < ilen; i += 1) {
            // Fallback from more to less specific language tag
            opt = opts[i];
            o = opt.split(/[\-_]/)[0];
            if (opt && Item.multi && Item.multi._keys[field] && Item.multi._keys[field][opt]) {
                ret = Item.multi._keys[field][opt];
                break;
            } else if (o && Item.multi && Item.multi._keys[field] && Item.multi._keys[field][o]) {
                ret = Item.multi._keys[field][o];
                break;
            }
        }
        if (!ret && use_default) {
            ret = Item[field];
        }
        return ret;
    }

    //
    function setAbbreviationFallback(b) {
        opt.abbreviation_fallback = b;
    }
    this.setAbbreviationFallback = setAbbreviationFallback;

    //
    function setAlternativeVariableName(s) {
        opt.alternative_varname = s;
    }
    this.setAlternativeVariableName = setAlternativeVariableName;

    //
    function setTransformLocale(s) {
        opt.transform_locale = s;
    }
    this.setTransformLocale = setTransformLocale;

    //
    function setTransformFallback(b) {
        opt.transform_fallback = b;
    }
    this.setTransformFallback = setTransformFallback;

    // Setter for abbreviation lists
    // This initializes a single abbreviation based on known
    // data.
    function loadAbbreviation(jurisdiction, category, orig) {
        var pos, len;
        if (!jurisdiction) {
            jurisdiction = "default";
        }
        if (!orig) {
            return jurisdiction;
        }

        // The getAbbreviation() function should check the
        // external DB for the content key. If a value exists
        // in this[category] and no value exists in DB, the entry
        // in memory is left untouched. If a value does exist in
        // DB, the memory value is created.
        //
        // See testrunner_stdrhino.js for an example.
        if (state.sys.getAbbreviation 
            && (!this.abbrevs[jurisdiction]
                || !this.abbrevs[jurisdiction][category][orig])) {
            // jurisdiction could change to "default"
            state.sys.getAbbreviation(state.opt.styleID, this.abbrevs, jurisdiction, category, orig);
        }
        return jurisdiction;
    }
    this.loadAbbreviation = loadAbbreviation;

    function publisherCheck (tok, Item, primary) {
        var varname = tok.variables[0];
        if (state.publisherOutput && primary) {
            if (["publisher","publisher-place"].indexOf(varname) === -1) {
                return false;
            } else {
                // In this case, the publisher bundle will be rendered
                // at the close of the group, by the closing group node.
                state.publisherOutput[varname + "-token"] = tok;
                state.publisherOutput.varlist.push(varname);
                var lst = primary.split(/;\s*/);
                if (lst.length === state.publisherOutput[varname + "-list"].length) {
                    state.publisherOutput[varname + "-list"] = lst;
                }
                // XXX Abbreviate each of the items in the list here!
                for (var i = 0, ilen = lst.length; i < ilen; i += 1) {
                    lst[i] = abbreviate(state, Item, false, lst[i], "institution-part", true);
                }
                state.tmp[varname + "-token"] = tok;
                return true;
            }
        }
        return false;
    }

    // Return function appropriate to selected options
    function getOutputFunction(variables) {
        var mytoken, mysubsection, myfieldname, abbreviation_fallback, alternative_varname, transform_locale, transform_fallback, getTextSubfield;

        // Freeze mandatory values
        mytoken = CSL.Util.cloneToken(token); // the token isn't needed, is it?
        mysubsection = subsection;
        myfieldname = fieldname;

        // Freeze option values
        abbreviation_fallback = opt.abbreviation_fallback;
        alternative_varname = opt.alternative_varname;
        transform_locale = opt.transform_locale;
        transform_fallback = opt.transform_fallback;

        // XXXXX This is a try-and-see change, we'll see how it goes.
        // Apply uniform transforms to all variables that request
        // translation.
        if (transform_locale === "locale-sec") {
            // Long form, with secondary translation
            return function (state, Item) {
                var primary, secondary, primary_tok, secondary_tok, key;
                if (!variables[0]) {
                    return null;
                }
                
                // Problem for multilingual: we really should be
                // checking for sanity on the basis of the output
                // strings to be actually used. (also below)
                if (state.tmp["publisher-list"]) {
                    if (variables[0] === "publisher") {
                        state.tmp["publisher-token"] = this;
                    } else if (variables[0] === "publisher-place") {
                        state.tmp["publisher-place-token"] = this;
                    }
                    return null;
                }
                if (state.opt["locale-suppress-title-transliteration"] 
                    || !((state.tmp.area === 'bibliography'
                        || (state.opt.xclass === "note" &&
                            state.tmp.area === "citation"))
                        )
                    ) {
                    primary = Item[myfieldname];
                } else {
                    primary = getTextSubField(Item, myfieldname, "locale-pri", transform_fallback);
                }
                // Signifying short form -- the variable name is misleading.
                if (mysubsection) {
                    primary = abbreviate(state, Item, alternative_varname, primary, mysubsection, true);
                }
                secondary = getTextSubField(Item, myfieldname, "locale-sec");
                if ("demote" === this["leading-noise-words"]) {
                    primary = CSL.demoteNoiseWords(state, primary);
                    secondary = CSL.demoteNoiseWords(state, secondary);
                }
                if (secondary && ((state.tmp.area === 'bibliography' || (state.opt.xclass === "note" && state.tmp.area === "citation")))) {
                    // Signifying short form -- again, the variable name is misleading.
                    if (mysubsection) {
                        secondary = abbreviate(state, Item, alternative_varname, secondary, mysubsection, true);
                    }
                    primary_tok = CSL.Util.cloneToken(this);
                    primary_tok.strings.suffix = "";
                    secondary_tok = new CSL.Token("text", CSL.SINGLETON);
                    secondary_tok.strings.suffix = "]" + this.strings.suffix;
                    secondary_tok.strings.prefix = " [";
        
                    state.output.append(primary, primary_tok);
                    state.output.append(secondary, secondary_tok);
                } else {
                    state.output.append(primary, this);
                }
                return null;
            };
        } else {
            return function (state, Item) {
                var primary;
                if (!variables[0]) {
                    return null;
                }
                primary = getTextSubField(Item, myfieldname, transform_locale, transform_fallback);

                // Factor this out
                if (publisherCheck(this, Item, primary)) {
                    return null;
                } else {
                    if ("demote" === this["leading-noise-words"]) {
                        primary = CSL.demoteNoiseWords(state, primary);
                    }
                    // Safe, because when state.tmp["publisher-list"] exists,
                    // the variable must be one of publisher or publisher-place.
                    primary = abbreviate(state, Item, alternative_varname, primary, mysubsection, true);
                    state.output.append(primary, this);
                }
                return null;
            };
        }
    }
    this.getOutputFunction = getOutputFunction;

    function getStaticOrder (name, refresh) {
        var static_ordering_val = false;
        if (!refresh && name["static-ordering"]) {
            static_ordering_val = true;
        } else if (!(name.family.replace('"', '', 'g') + name.given).match(CSL.ROMANESQUE_REGEXP)) {
            static_ordering_val = true;
        } else if (name.multi && name.multi.main && name.multi.main.slice(0,2) == 'vn') {
            static_ordering_val = true;
        } else {
            if (state.opt['auto-vietnamese-names']
                && (CSL.VIETNAMESE_NAMES.exec(name.family + " " + name.given)
                    && CSL.VIETNAMESE_SPECIALS.exec(name.family + name.given))) {

                static_ordering_val = true;
            }
        }
        return static_ordering_val;
    }

    // The name transform code is placed here to keep similar things
    // in one place.  Obviously this module could do with a little
    // tidying up.

    /*
     * Return a single name object
     */
    function getName (state, name, langTags) {
        var i, ret, optLangTag, ilen, key, langTag;
        if (state.tmp.extension) {
             langTags = state.opt["locale-sort"];
        }
        if ("string" === typeof langTags) {
            langTags = [langTags];
        }
        // Normalize to string
        if (!name.family) {
            name.family = "";
        }
        if (!name.given) {
            name.given = "";
        }
        //
        // Optionally add a static-ordering toggle for non-roman, non-Cyrillic
        // names, based on the headline values.
        //
        var static_ordering_freshcheck = false;
        var block_initialize = false;
        var transliterated = false;
        var static_ordering_val = getStaticOrder(name);
        //
        // Step through the requested languages in sequence
        // until a match is found
        //
        if (langTags && name.multi) {
            for (i = 0, ilen = langTags.length; i < ilen; i += 1) {
                langTag = langTags[i];
                if (name.multi._key[langTag]) {
                    var origName = name;
                    name = name.multi._key[langTag];
                    transliterated = true;
                    if (!state.opt['locale-use-original-name-format']) {
                        static_ordering_freshcheck = true;
                    } else {
                        // Quash initialize-with if original was non-romanesque
                        // and we are trying to preserve the original formatting
                        // conventions.
                        // (i.e. supply as much information as possible if
                        // the transliteration spans radically different
                        // writing conventions)
                        if ((name.family.replace('"','','g') + name.given).match(CSL.ROMANESQUE_REGEXP)) {
                            block_initialize = true;
                        }
                    }
                    break;
                }
            }
        }
        // var clone the item before writing into it
        name = {
            family:name.family,
            given:name.given,
            "non-dropping-particle":name["non-dropping-particle"],
            "dropping-particle":name["dropping-particle"],
            suffix:name.suffix,
            "static-ordering":static_ordering_val,
            "parse-names":name["parse-names"],
            "comma-suffix":name["comma-suffix"],
            "comma-dropping-particle":name["comma-dropping-particle"],
            transliterated:transliterated,
            block_initialize:block_initialize,
            literal:name.literal,
            isInstitution:name.isInstitution,
            orig:origName
        };
        if (static_ordering_freshcheck &&
            !getStaticOrder(name, true)) {
            
            name["static-ordering"] = false;
        }
        if (!name.literal && (!name.given && name.family && name.isInstitution)) {
            name.literal = name.family;
        }
        if (name.literal) {
            delete name.family;
            delete name.given;
        }
        return name;
    }
    this.name = getName;

    function getHereinafter (Item) {
        var hereinafter_author_title = [];
        if (state.tmp.first_name_string) {
            hereinafter_author_title.push(state.tmp.first_name_string);
        }
        if (Item.title) {
            hereinafter_author_title.push(Item.title);
        }
        var hereinafter_metadata = [];
        if (Item.type) {
            hereinafter_metadata.push("type:" + Item.type);
        }
        if (Item.issued) {
            var date = [];
            for (var j = 0, jlen = CSL.DATE_PARTS.length; j < jlen; j += 1) {
                if (Item.issued[CSL.DATE_PARTS[j]]) {
                    var element =  Item.issued[CSL.DATE_PARTS[j]];
                    while (element.length < 2) {
                        element = "0" + element;
                    }
                    date.push(element);
                }
            }
            date = date.join("-");
            if (date) {
                hereinafter_metadata.push("date:" + date);
            }
        }
        if (Item.jurisdiction) {
            hereinafter_metadata.push("jurisdiction:" + Item.jurisdiction);
        }
        hereinafter_metadata = hereinafter_metadata.join(", ");
        if (hereinafter_metadata) {
            hereinafter_metadata = " [" + hereinafter_metadata + "]";
        }
        var hereinafter_key = hereinafter_author_title.join(", ") + hereinafter_metadata;
        return hereinafter_key;
    }
    this.getHereinafter = getHereinafter;
};



