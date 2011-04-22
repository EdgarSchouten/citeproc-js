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

CSL.NameOutput.prototype.divideAndTransliterateNames = function (Item, variables) {
	var Item = this.Item;
	var variables = this.variables;
	this.varnames = variables.slice();
	this.freeters = {};
	this.persons = {};
	this.institutions = {};
	for (var i = 0, ilen = variables.length; i < ilen; i += 1) {
		var v = variables[i];
		this.variable_offset[v] = this.nameset_offset;
		var values = this._normalizeVariableValue(Item, v);
		if (this.name.strings["suppress-min"] && values.length >= this.name.strings["suppress-min"]) {
			values = [];
		}
		if (this.etal_min === 1 && this.etal_use_first === 1) {
			var chopvar = v;
		} else {
			var chopvar = false;
		}
		this._getFreeters(v, values, chopvar);
		this._getPersonsAndInstitutions(v, values, chopvar);
	}
};

CSL.NameOutput.prototype._normalizeVariableValue = function (Item, variable) {
	if ("string" === typeof Item[variable]) {
		var names = [{literal: Item[variable]}];
	} else if (!Item[variable]) {
		var names = [];
	} else {
		var names = Item[variable].slice();
	}
	// Transliteration happens here, if at all.
	for (var i = 0, ilen = names.length; i < ilen; i += 1) {
		//if (names[i].literal) {
		//}
		this._parseName(names[i]);
		var name = this.state.transform.name(this.state, names[i], this.state.opt["locale-pri"]);
		names[i] = name;
	}
	return names;
};

CSL.NameOutput.prototype._getFreeters = function (v, values, chopvar) {
	this.freeters[v] = [];
	for (var i = values.length - 1; i > -1; i += -1) {
		if (this.isPerson(values[i])) {
			if (this._please_chop === v) {
				values.pop();
				this._please_chop = false;
				continue;
			}
			this.freeters[v].push(values.pop());
			if (chopvar) {
				this._clearValues(values);
				this._please_chop = chopvar;
				break;
			}
		} else {
			break;
		}
	}
	this.freeters[v].reverse();
	if (this.freeters[v].length) {
		this.nameset_offset += 1;
	}
};

CSL.NameOutput.prototype._getPersonsAndInstitutions = function (v, values, chopvar) {
	this.persons[v] = [];
	this.institutions[v] = [];
	var persons = [];
	var has_affiliates = false;
	var first = true;
	for (var i = values.length - 1; i > -1; i += -1) {
		if (this.isPerson(values[i])) {
			if (this._please_chop === v) {
				this._please_chop = false;
				continue;
			}
			if (chopvar) {
				this.freeters[v].push(values[i]);
				this._clearValues(values);
				this._please_chop = chopvar;
				break;
			} else {
				persons.push(values[i]);
			}
		} else {
			has_affiliates = true;
			this.institutions[v].push(values[i]);
			if (!first) {
				persons.reverse();
				this.persons[v].push(persons);
				persons = [];
			}
			first = false;
		}
	}
	if (has_affiliates) {
		persons.reverse();
		this.persons[v].push(persons);
		this.persons[v].reverse();
		this.institutions[v].reverse();
	}
	if (this.institutions[v].length) {
		if (this._please_chop === v) {
			this.institutions[v] = this.institutions[v].slice(1);
			this._please_chop = false;
		} else if (chopvar && !this._please_chop) {
			this.institutions[v] = this.institutions[v].slice(0, 1);
			values = [];
			this._please_chop = chopvar;
		}
	}
	if (this.institutions[v].length) {
		this.nameset_offset += 1;
	}
	for (var i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
		if (this.persons[v][i].length) {
			this.nameset_offset += 1;
		}
		this.institutions[v][i] = this._splitInstitution(this.institutions[v][i], v, i);
	}
};

CSL.NameOutput.prototype._clearValues = function (values) {
	for (var i = values.length - 1; i > -1; i += -1) {
		values.pop();
	}
};

CSL.NameOutput.prototype._splitInstitution = function (value, v, i) {
	var ret = {};
	if (value.literal.slice(0,1) === '"' && value.literal.slice(-1) === '"') {
		ret["long"] = [value.literal.slice(1,-1)];
	} else {
		ret["long"] = this._trimInstitution(value.literal.split(/\s*,\s*/), v, i);
	}
	var str = this.state.transform.institution[value.literal];
	if (str) {
		if (str.slice(0,1) === '"' && str.slice(-1) === '"') {
			ret["short"] = [str.slice(1,-1)];
		} else {
			ret["short"] = this._trimInstitution(str.split(/\s*,\s*/), v, i);
		}
	} else {
		ret["short"] = false;
	}
	return ret;
};

CSL.NameOutput.prototype._trimInstitution = function (subunits, v, i) {
	var use_first = this.institution.strings["use-first"];
	if (!use_first) {
		if (this.persons[v][i].length === 0) {
			use_first = this.institution.strings["substitute-use-first"];
		}
	}
	if (!use_first) {
		use_first = 0;
	}
	var append_last = this.institution.strings["use-last"];
	if (!append_last) {
		append_last = 0;
	}
	if (use_first || append_last) {
		var s = subunits.slice();
		var subunits = subunits.slice(0, use_first);
		var s = s.slice(use_first);
		if (append_last) {
			if (append_last > s.length) {
				append_last = s.length;
			}
			if (append_last) {
				subunits = subunits.concat(s.slice((s.length - append_last)));
			}
		}
	}
	return subunits;
};
