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

CSL.Util.Institutions = {};

/**
 * Build a set of names, less any label or et al. tag
 */
CSL.Util.Institutions.outputInstitutions = function (state, display_names) {
	var len, pos, name, institution, value, token_long, token_short, parts;
	state.output.openLevel("institution");
	len = display_names.length;
	for (pos = 0; pos < len; pos += 1) {
		name = display_names[pos];
		institution = state.output.getToken("institution");
		value = name.literal;
		if (state.transform.institution[value]) {
			token_long = state.output.mergeTokenStrings("institution-long", "institution-if-short");
		} else {
			token_long = state.output.getToken("institution-long");
		}
		token_short = state.output.getToken("institution-short");
		parts = institution.strings["institution-parts"];
		if ("short" === parts) {
			state.transform.output(state, value, token_short, token_long, true);
		} else if ("short-long" === parts) {
			state.transform.output(state, value, token_short);
			state.output.append(value, token_long);
		} else if ("long-short" === parts) {
			state.output.append(value, token_long);
			state.transform.output(state, value, token_short);
		} else {
			state.output.append(value, token_long);
		}
	}
	// institution
	state.output.closeLevel();
};
