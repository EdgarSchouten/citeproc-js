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

CSL.Engine.prototype.remapSectionVariable = function (inputList) {
    for (var i = 0, ilen = inputList.length; i < ilen; i += 1) {
        var Item = inputList[i][0];
        var item = inputList[i][1];
        if (!Item.section
            && ["bill", "legislation"].indexOf(Item.type) > -1
            && this.opt.development_extensions.clobber_locator_if_no_statute_section) {
            
            item.locator = undefined;
            item.label = undefined;
        } else if (Item.section
            && item
            && ["bill", "legislation"].indexOf(Item.type) > -1
            && this.opt.development_extensions.static_statute_locator) {

            var value = "" + Item.section;
            var locator = "";
            var labelstr = "";
            if (item.locator) {
                locator = item.locator;
                // Needs work around here.
                var firstword = item.locator.split(/\s/)[0];
                if (item.label && !CSL.STATUTE_SUBDIV_STRINGS[firstword] && [",", "&"].indexOf(firstword) === -1) {
                    labelstr = " " + CSL.STATUTE_SUBDIV_STRINGS_REVERSE[item.label] + " ";
                }
                locator = labelstr + locator;
                if (locator.slice(0,1) === "&") {
                    locator = " " + locator;
                }
                value = value + locator;
            }
            // Modify locator if appropriate.
            // This should happen on import, no? Or does it already
            // Questions, questions. The code could use some cleanup
            // around here.
            item.label = "section";
            if (value) {
                var splt = value.split(/\s+/);
                if (CSL.STATUTE_SUBDIV_STRINGS[splt[0]]) {
                    item.label = CSL.STATUTE_SUBDIV_STRINGS[splt[0]];
                } else {
                    value = "sec. " + value;
                }
            }
            var m = value.match(CSL.STATUTE_SUBDIV_GROUPED_REGEX);
            if (m) {
                var splt = value.split(CSL.STATUTE_SUBDIV_PLAIN_REGEX);
                if (splt.length > 1) {
                    var lst = [];
                    lst.push(splt[1].replace(/\s*$/, "").replace(/^\s*/, ""));
                    var has_repeat_label = false;
                    var has_sublabel = false;
                    for (var j=2, jlen=splt.length; j < jlen; j += 1) {
                        var subdiv = m[j - 1].replace(/^\s*/, "");
                        var fullsubdiv = CSL.STATUTE_SUBDIV_STRINGS[subdiv];
                        if (fullsubdiv === item.label) {
                            has_repeat_label = true;
                        } else {
                            has_sublabel = true;
                        }
                        lst.push(subdiv);
                        lst.push(splt[j].replace(/\s*$/, "").replace(/^\s*/, ""));
                    }
                    for (var j=lst.length - 2; j > 0; j += -2) {
                        if (!has_sublabel) {
                            lst = lst.slice(0,j).concat(lst.slice(j + 1));
                        }
                    }
                    value = lst.join(" ");
                    if (!has_sublabel && has_repeat_label) {
                        item.force_pluralism = 1;
                    } else {
                        item.force_pluralism = 0;
                    }
                }
            }
            item.locator = value;
        }
    }
}
