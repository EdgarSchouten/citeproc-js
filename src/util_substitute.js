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

CSL.Util.substituteStart = function (state, target) {
	var element_trace, display, bib_first, func, choose_start, if_start;
	//
	// Contains body code for both substitute and first-field/remaining-fields
	// formatting.
	//
	if (("text" === this.name && !this.postponed_macro) || ["number", "date", "names"].indexOf(this.name) > -1) {
		element_trace = function (state, Item, item) {
			if (state.tmp.element_trace.value() === "author" || "names" === this.name) {
				if (item && item["author-only"]) {
					state.tmp.element_trace.push("do-not-suppress-me");
				} else if (item && item["suppress-author"]) {
					state.tmp.element_trace.push("suppress-me");
				}
			} else {
				if (item && item["author-only"]) {
					state.tmp.element_trace.push("suppress-me");
				} else if (item && item["suppress-author"]) {
					state.tmp.element_trace.push("do-not-suppress-me");
				}
			}
		};
		this.execs.push(element_trace);
	}
	//if (state.build.area === "bibliography") {
		display = this.strings.cls;
		this.strings.cls = false;
		if (state.build.render_nesting_level === 0) {
			//
			// The markup formerly known as @bibliography/first
			//
			// Separate second-field-align from the generic display logic.
			// There will be some code replication, but not in the
			// assembled style.
			//
			if (state.build.area == "bibliography" && state.bibliography.opt["second-field-align"]) {
				bib_first = new CSL.Token("group", CSL.START);
				bib_first.decorations = [["@display", "left-margin"]];
				func = function (state, Item) {
					if (!state.tmp.render_seen) {
						state.output.startTag("bib_first", bib_first);
						// XXX: this will go away
						state.tmp.count_offset_characters = true;
						// this will not
						state.output.calculate_offset = true;
					}
				};
				bib_first.execs.push(func);
				target.push(bib_first);
			} else if (CSL.DISPLAY_CLASSES.indexOf(display) > -1) {
				bib_first = new CSL.Token("group", CSL.START);
				bib_first.decorations = [["@display", display]];
				func = function (state, Item) {
					state.output.startTag("bib_first", bib_first);
					//if (bib_first.strings.cls === "left-margin") {
					//	state.tmp.count_offset_characters = true;
					//}
				};
				bib_first.execs.push(func);
				target.push(bib_first);
			}
			state.build.cls = display;
		}
		state.build.render_nesting_level += 1;
	//}
	if (state.build.substitute_level.value() === 1) {
		//
		// All top-level elements in a substitute environment get
		// wrapped in conditionals.  The substitute_level variable
		// is a stack, because spanned names elements (with their
		// own substitute environments) can be nested inside
		// a substitute environment.
		//
		// (okay, we use conditionals a lot more than that.
		// we slot them in for author-only as well...)
		choose_start = new CSL.Token("choose", CSL.START);
		target.push(choose_start);
		if_start = new CSL.Token("if", CSL.START);
		//
		// Set a test of the shadow if token to skip this
		// macro if we have acquired a name value.

		// check for variable
		func = function (state, Item) {
			if (state.tmp.can_substitute.value()) {
				return true;
			}
			return false;
		};
		if_start.tests.push(func);
		//
		// this is cut-and-paste of the "any" evaluator
		// function, from Attributes.  These functions
		// should be defined in a namespace for reuse.
		// Sometime.
		if_start.evaluator = state.fun.match.any;
		target.push(if_start);
	}
};


CSL.Util.substituteEnd = function (state, target) {
	var func, bib_first_end, bib_other, if_end, choose_end, toplevel, hasval, author_substitute, printing, str;
	//if (state.build.area === "bibliography") {
		state.build.render_nesting_level += -1;
		if (state.build.render_nesting_level === 0) {
			if (state.build.cls) {
				func = function (state, Item) {
					state.output.endTag("bib_first");
					// XXX: this will go away
					state.tmp.count_offset_characters = false;
					// this will not
					state.output.calculate_offset = false;
				};
				this.execs.push(func);
				state.build.cls = false;
			}
			if (state.build.area == "bibliography" && state.bibliography.opt["second-field-align"]) {
				bib_first_end = new CSL.Token("group", CSL.END);
				// first func end
				func = function (state, Item) {
					if (!state.tmp.render_seen) {
						state.output.endTag(); // closes bib_first
						// XXX: this will go away
						state.tmp.count_offset_characters = false;
						// this will not
						state.output.calculate_offset = false;
					}
				};
				bib_first_end.execs.push(func);
				target.push(bib_first_end);
				bib_other = new CSL.Token("group", CSL.START);
				bib_other.decorations = [["@display", "right-inline"]];
				func = function (state, Item) {
					if (!state.tmp.render_seen) {
						state.tmp.render_seen = true;
						state.output.startTag("bib_other", bib_other);
					}
				};
				bib_other.execs.push(func);
				target.push(bib_other);
			}
		}
	//}
	if (state.build.substitute_level.value() === 1) {
		if_end = new CSL.Token("if", CSL.END);
		target.push(if_end);
		choose_end = new CSL.Token("choose", CSL.END);
		target.push(choose_end);
	}

	toplevel = "names" === this.name && state.build.substitute_level.value() === 0;
	hasval = "string" === typeof state[state.build.area].opt["subsequent-author-substitute"];
	if (toplevel && hasval) {
		author_substitute = new CSL.Token("text", CSL.SINGLETON);
		func = function (state, Item) {
			printing = !state.tmp.suppress_decorations;
			if (printing) {
				if (!state.tmp.rendered_name) {
					state.tmp.rendered_name = state.output.string(state, state.tmp.name_node.blobs, false);
					if (state.tmp.rendered_name) {
						//CSL.debug("TRY! "+state.tmp.rendered_name);
						if (state.tmp.rendered_name === state.tmp.last_rendered_name) {
							str = new CSL.Blob(false, state[state.tmp.area].opt["subsequent-author-substitute"]);
							state.tmp.name_node.blobs = [str];
						}
						state.tmp.last_rendered_name = state.tmp.rendered_name;
					}
				}
			}
		};
		author_substitute.execs.push(func);
		target.push(author_substitute);
	}

	if (("text" === this.name && !this.postponed_macro) || ["number", "date", "names"].indexOf(this.name) > -1) {
		// element trace
		func = function (state, Item) {
			state.tmp.element_trace.pop();
		};
		this.execs.push(func);
	}
};
