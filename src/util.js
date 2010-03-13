/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
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
 */

/**
 * Utilities for various things.
 * @namespace Utilities
 */
CSL.Util = {};

/*
 * Also dumping this stuff here temporarily.
 */
CSL.Util.Match = function () {
	var func, pos, len, reslist, res, ppos, llen;

	this.any = function (token, state, Item, item) {
		//
		// assume false, return true on any single true hit
		//
		var ret = false;
		len = token.tests.length;
		for (pos = 0; pos < len; pos += 1) {
			func = token.tests[pos];
			reslist = func.call(token, state, Item, item);
			if ("object" !== typeof reslist) {
				reslist = [reslist];
			}
			llen = reslist.length;
			for (ppos = 0; ppos < llen; ppos += 1) {
				if (reslist[ppos]) {
					ret = true;
					break;
				}
			}
			if (ret) {
				break;
			}
		}
		if (ret) {
			ret = token.succeed;
			state.tmp.jump.replace("succeed");
		} else {
			ret = token.fail;
			state.tmp.jump.replace("fail");
		}
		return ret;
	};

	this.none = function (token, state, Item, item) {
		//
		// assume true, return false on any single true hit
		//
		var ret = true;
		len = this.tests.length;
		for (pos = 0; pos < len; pos += 1) {
			func = this.tests[pos];
			reslist = func.call(token, state, Item, item);
			if ("object" !== typeof reslist) {
				reslist = [reslist];
			}
			llen = reslist.length;
			for (ppos = 0; ppos < llen; ppos += 1) {
				if (reslist[ppos]) {
					ret = false;
					break;
				}
			}
			if (!ret) {
				break;
			}
		}
		if (ret) {
			ret = token.succeed;
			state.tmp.jump.replace("succeed");
		} else {
			ret = token.fail;
			state.tmp.jump.replace("fail");
		}
		return ret;
	};

	this.all = function (token, state, Item, item) {
		//
		// assume true, return false on any single false hit
		//
		var ret = true;
		len = this.tests.length;
		for (pos = 0; pos < len; pos += 1) {
			func = this.tests[pos];
			reslist = func.call(token, state, Item, item);
			if ("object" !== typeof reslist) {
				reslist = [reslist];
			}
			llen = reslist.length;
			for (pos = 0; pos < len; pos += 1) {
				if (!reslist[ppos]) {
					ret = false;
					break;
				}
			}
			if (!ret) {
				break;
			}
		}
		if (ret) {
			ret = token.succeed;
			state.tmp.jump.replace("succeed");
		} else {
			ret = token.fail;
			state.tmp.jump.replace("fail");
		}
		return ret;
	};
};
