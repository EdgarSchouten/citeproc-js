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

CSL.NameOutput = function(state, Item, item, variables) {
	this.debug = false;
	if (this.debug) {
		print("(1)");
	}
	this.state = state;
	this.Item = Item;
	this.item = item;
	this.nameset_base = 0;
};

CSL.NameOutput.prototype.init = function (names) {
	if (this.nameset_offset) {
		this.nameset_base = this.nameset_base + this.nameset_offset;
   	}
	this.nameset_offset = 0;
	this.names = names;
	this.variables = names.variables;
	this.suppress = {
		persons:false,
		institutions:false,
		freeters:false
	}
	this["et-al"] = undefined;
	this["with"] = undefined;
	this.name = undefined;
};


CSL.NameOutput.prototype.reinit = function (names) {
	if (!this._hasValues() && false) {
		this.nameset_offset = 0;
		// What-all should be carried across from the subsidiary
		// names node, and on what conditions? For each attribute,
		// and decoration, is it an override, or is it additive?
		this.variables = names.variables;
		this.suppress = {
			persons:false,
			institutions:false,
			freeters:false
		}
	}
};

CSL.NameOutput.prototype._hasValues = function () {
	for (var i = 0, ilen = this.variables.length; i < ilen; i += 1) {
		var v = this.variables[i];
		if (this.Item[v]) {
			// ??? If substitution is working correctly,
			// this check should not be necessary
			return true;
		}
	}
	return false;
};

CSL.NameOutput.prototype.outputNames = function () {
	var variables = this.variables;
	this.variable_offset = {};
	if (this.debug) {
		print("(2)");
	}
	// util_names_etalconfig.js
	this.getEtAlConfig();
	if (this.debug) {
		print("(3)");
	}
	// util_names_divide.js
	this.divideAndTransliterateNames();
	if (this.debug) {
		print("(4)");
	}
	// util_names_truncate.js
	this.truncatePersonalNameLists();
	if (this.debug) {
		print("(5)");
	}
	// util_names_constraints.js
	this.constrainNames();
	if (this.debug) {
		print("(6)");
	}
	// form="count"
	if (this.name.strings.form === "count") {
		this.state.output.append(this.names_count, "empty");
		return;
	}

	// util_names_disambig.js
	this.disambigNames();
	if (this.debug) {
		print("(7)");
	}
	this.setEtAlParameters();
	if (this.debug) {
		print("(8)");
	}
	this.setCommonTerm();
	if (this.debug) {
		print("(9)");
	}
	this.renderAllNames();
	if (this.debug) {
		print("(10)");
	}
	var blob_list = [];
	var institution_sets = [];
	for (var i = 0, ilen = variables.length; i < ilen; i += 1) {
		var v = variables[i];
		for (var j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
			institution_sets.push(this.joinPersonsAndInstitutions([this.persons[v][j], this.institutions[v][j]]));
		}
		var pos = this.nameset_base + this.variable_offset[v] + 1;
		var institutions = this.joinInstitutionSets(institution_sets, pos);
		//if (v === "author") {
		//	print("  freeters[v] (2): "+this.freeters[v].blobs[0].blobs[0].blobs[0].blobs[0].blobs[0].blobs[0].blobs);
		//}
		var varblob = this.joinFreetersAndInstitutionSets([this.freeters[v], institutions]);
		if (varblob) {
			// Apply labels, if any
			varblob = this._applyLabels(varblob, v);
			blob_list.push(varblob);
		}
		if (this.common_term) {
			break;
		}
	}
	if (this.debug) {
		print("(11)");
	}
	this.state.output.openLevel("empty");
	if (this.debug) {
		print("(12)");
	}
	for (var i = 0, ilen = blob_list.length; i < ilen; i += 1) {
		// notSerious
		this.state.output.append(blob_list[i], "literal", true);
	}
	if (this.debug) {
		print("(13)");
	}
	this.state.output.closeLevel("empty");
	if (this.debug) {
		print("(14)");
	}
	var blob = this.state.output.pop();
	if (this.debug) {
		print("(15)");
	}
	this.state.output.append(blob, this.names);
	if (this.debug) {
		print("(16)");
	}
};

CSL.NameOutput.prototype._applyLabels = function (blob, v) {
	if (!this.label) {
		return blob;
	}
	var plural = 0;
	var num = this.freeters[v].length + this.institutions[v].length;
	if (num > 1) {
		plural = 1;
	} else {
		for (var i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
			num += this.persons[v][j].length;
		}
		if (num > 1) {
			plural = 1;
		}
	}
	// Some code duplication here, should be factored out.
	if (this.label.before) {
		var txt = this._buildLabel(v, plural, "before");
		this.state.output.openLevel("empty");
		this.state.output.append(txt, this.label.before, true);
		this.state.output.append(blob, "literal", true);
		this.state.output.closeLevel("empty");
		blob = this.state.output.pop();
	}
	if (this.label.after) {
		var txt = this._buildLabel(v, plural, "after")
		this.state.output.openLevel("empty");
		this.state.output.append(blob, "literal", true);
		this.state.output.append(txt, this.label.after, true);
		this.state.output.closeLevel("empty");
		blob = this.state.output.pop();
	}
	return blob;
};

CSL.NameOutput.prototype._buildLabel = function (term, plural, position) {
	if (this.common_term) {
		term = this.common_term;
	}
	var node = this.label[position];
	if (node) {
		var ret = CSL.castLabel(this.state, node, term, plural);
	} else {
		var ret = false;
	}
	return ret;
};



/*
CSL.NameOutput.prototype.suppressNames = function() {
	suppress_condition = suppress_min && display_names.length >= suppress_min;
	if (suppress_condition) {
		continue;
	}
}
*/
