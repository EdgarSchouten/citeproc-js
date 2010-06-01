/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights
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
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
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

CSL.cloneAmbigConfig = function (config, oldconfig, itemID) {
	var ret, param, pos, ppos, len, llen;
	ret = {};
	ret.names = [];
	ret.givens = [];
	ret.year_suffix = false;
	ret.disambiguate = false;
	len = config.names.length;
	for (pos = 0; pos < len; pos += 1) {
		param = config.names[pos];
		if (oldconfig && oldconfig.names[pos] !== param) {
			// print("hello "+i);
			this.tmp.taintedItemIDs[itemID] = true;
			oldconfig = false;
		}
		ret.names[pos] = param;
	}
	len = config.givens.length;
	for (pos = 0; pos < len; pos += 1) {
		param = [];
		llen = config.givens[pos].length;
		for (ppos = 0; ppos < llen; ppos += 1) {
			// condition at line 312 of disambiguate.js protects against negative
			// values of j
			if (oldconfig && oldconfig.givens[pos] && oldconfig.givens[pos][ppos] !== config.givens[pos][ppos]) {
				// print("hello "+i+":"+j);
				this.tmp.taintedItemIDs[itemID] = true;
				oldconfig = false;
			}
			param.push(config.givens[pos][ppos]);
		}
		ret.givens.push(param);
	}
	if (oldconfig && oldconfig.year_suffix !== config.year_suffix) {
		// print("hello year_suffix");
		this.tmp.taintedItemIDs[itemID] = true;
		oldconfig = false;
	}
	ret.year_suffix = config.year_suffix;
	if (oldconfig && oldconfig.year_suffix !== config.year_suffix) {
		// print("hello disambiguate");
		this.tmp.taintedItemIDs[itemID] = true;
		oldconfig = false;
	}
	ret.disambiguate = config.disambiguate;
	return ret;
};



