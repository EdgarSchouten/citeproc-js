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

CSL.Node.text = {
	build: function (state, target) {
		var variable, func, form, plural, id, num, number, formatter, firstoutput, specialdelimiter, label, myname, names, name, year, suffix, term, dp, len, pos, n, m, value, primary, secondary, primary_tok, secondary_tok, flag;
		CSL.Util.substituteStart.call(this, state, target);
		if (this.postponed_macro) {
			CSL.expandMacro.call(state, this);
		} else {
			// ...
			//
			// Do non-macro stuff
			variable = this.variables[0];
			if (variable) {
				func = function (state, Item) {
					state.parallel.StartVariable(this.variables[0]);
					state.parallel.AppendToVariable(Item[this.variables[0]]);
				};
				this.execs.push(func);
			}
			form = "long";
			plural = 0;
			if (this.strings.form) {
				form = this.strings.form;
			}
			if (this.strings.plural) {
				plural = this.strings.plural;
			}
			if ("citation-number" === variable || "year-suffix" === variable || "citation-label" === variable) {
				//
				// citation-number and year-suffix are super special,
				// because they are rangeables, and require a completely
				// different set of formatting parameters on the output
				// queue.
				if (variable === "citation-number") {
					state.opt.update_mode = CSL.NUMERIC;
					//this.strings.is_rangeable = true;
					if ("citation-number" === state[state.tmp.area].opt.collapse) {
						this.range_prefix = "-";
					}
					this.successor_prefix = state[state.build.area].opt.layout_delimiter;
					func = function (state, Item, item) {
						id = Item.id;
						if (!state.tmp.force_subsequent) {
							if (item && item["author-only"]) {
								state.tmp.element_trace.replace("do-not-suppress-me");
								term = CSL.Output.Formatters["capitalize-first"](state, state.getTerm("reference", "long", "singular"));
								state.output.append(term + " ");
								state.tmp.last_element_trace = true;
							}
							if (item && item["suppress-author"]) {
								if (state.tmp.last_element_trace) {
									state.tmp.element_trace.replace("suppress-me");
								}
								state.tmp.last_element_trace = false;
							}
							num = state.registry.registry[id].seq;
							number = new CSL.NumericBlob(num, this);
							state.output.append(number, "literal");
						}
					};
					this.execs.push(func);
				} else if (variable === "year-suffix") {

					state.opt.has_year_suffix = true;

					if (state[state.tmp.area].opt.collapse === "year-suffix-ranged") {
						this.range_prefix = "-";
					}
					if (state[state.tmp.area].opt["year-suffix-delimiter"]) {
						this.successor_prefix = state[state.build.area].opt["year-suffix-delimiter"];
					}
					func = function (state, Item) {
						if (state.registry.registry[Item.id] && state.registry.registry[Item.id].disambig[2]) {
							//state.output.append(state.registry.registry[Item.id].disambig[2],this);
							num = parseInt(state.registry.registry[Item.id].disambig[2], 10);
							number = new CSL.NumericBlob(num, this);
							formatter = new CSL.Util.Suffixator(CSL.SUFFIX_CHARS);
							number.setFormatter(formatter);
							state.output.append(number, "literal");
							//
							// don't ask :)
							// obviously the variable naming scheme needs
							// a little touching up
							firstoutput = false;
							len = state.tmp.term_sibling.mystack.length;
							for (pos = 0; pos < len; pos += 1) {
								flag = state.tmp.term_sibling.mystack[pos];
								if (!flag[2] && (flag[1] || (!flag[1] && !flag[0]))) {
									firstoutput = true;
									break;
								}
							}
							// firstoutput = state.tmp.term_sibling.mystack.indexOf(true) === -1;
							specialdelimiter = state[state.tmp.area].opt["year-suffix-delimiter"];
							if (firstoutput && specialdelimiter && !state.tmp.sort_key_flag) {
								state.tmp.splice_delimiter = state[state.tmp.area].opt["year-suffix-delimiter"];
							}
						}
					};
					this.execs.push(func);
				} else if (variable === "citation-label") {
					state.opt.has_year_suffix = true;
					func = function (state, Item) {
						label = Item["citation-label"];
						if (!label) {
							//
							// A shot in the dark
							//
							myname = state.getTerm("reference", "short", 0);
							len = CSL.CREATORS.length;
							for (pos = 0; pos < len; pos += 1) {
								n = CSL.CREATORS[pos];
								if (Item[n]) {
									names = Item[n];
									if (names && names.length) {
										name = names[0];
									}
									if (name && name.family) {
										myname = name.family.replace(/\s+/, "");
									} else if (name && name.literal) {
										myname = name.literal;
										m = myname.toLowerCase().match(/^(a|the|an\s+)/, "");
										if (m) {
											myname = myname.slice(m[1].length);
										}
									}
								}
							}
							year = "0000";
							if (Item.issued) {
								dp = Item.issued["date-parts"];
								if (dp && dp[0] && dp[0][0]) {
									year = "" + dp[0][0];
								}
							}
							label = myname + year;
						}
						suffix = "";
						if (state.registry.registry[Item.id] && state.registry.registry[Item.id].disambig[2]) {
							num = parseInt(state.registry.registry[Item.id].disambig[2], 10);
							suffix = state.fun.suffixator.format(num);
						}
						label += suffix;
						state.output.append(label, this);
					};
					this.execs.push(func);
				}
			} else {
				if (state.build.term) {
					term = state.build.term;
					term = state.getTerm(term, form, plural);
					if (this.strings["strip-periods"]) {
						term = term.replace(/\./g, "");
					}
					// printterm
					func = function (state, Item) {
						// if the term is not an empty string, flag this
						// same as a variable with content.
						if (term !== "") {
							flag = state.tmp.term_sibling.value();
							flag[0] = true;
							state.tmp.term_sibling.replace(flag);
						}
						// capitalize the first letter of a term, if it is the
						// first thing rendered in a citation (or if it is
						// being rendered immediately after terminal punctuation,
						// I guess, actually).
						if (!state.tmp.term_predecessor) {
							//CSL.debug("Capitalize");
							term = CSL.Output.Formatters["capitalize-first"](state, term);
							state.tmp.term_predecessor = true;
						}
						state.output.append(term, this);
					};
					this.execs.push(func);
					state.build.term = false;
					state.build.form = false;
					state.build.plural = false;
				} else if (this.variables.length) {
					if (["first-reference-note-number", "locator"].indexOf(this.variables[0]) > -1) {
						func = function (state, Item, item) {
							if (item && item[this.variables[0]]) {
								//state.tmp.backref_index.push(Item.id);
								state.output.append(item[this.variables[0]], this);
							}
						};
					} else if (this.variables[0] === "container-title" && form === "short") {
						// Use tracking function
						func = state.abbrev.getOutputFunc(this, this.variables[0], "journal", "journalAbbreviation");
					} else if (this.variables[0] === "collection-title" && form === "short") {
						// Use tracking function
						func = state.abbrev.getOutputFunc(this, this.variables[0], "series");
					} else if (this.variables[0] === "authority" && form === "short") {
						// Use tracking function
						func = state.abbrev.getOutputFunc(this, this.variables[0], "authority");
					} else if (this.variables[0] === "title") {
						if (state.build.area.slice(-5) === "_sort") {
							func = function (state, Item) {
								var value = Item[this.variables[0]];
								if (value) {
									value = state.getTextSubField(value, "locale-sort", true);
									state.output.append(value, this);
								}
							};
						} else {
							func = function (state, Item) {
								value = Item[this.variables[0]];
								if (value) {
									primary = state.getTextSubField(value, "locale-pri", true);
									secondary = state.getTextSubField(value, "locale-sec");

									if (secondary) {
										primary_tok = new CSL.Token("text", CSL.SINGLETON);
										secondary_tok = new CSL.Token("text", CSL.SINGLETON);
										for (var key in this.strings) {
											if (this.strings.hasOwnProperty(key)) {
												secondary_tok.strings[key] = this.strings[key];
												if (key === "suffix") {
													secondary_tok.strings.suffix = "]" + secondary_tok.strings.suffix;
													continue;
												} else if (key === "prefix") {
													secondary_tok.strings.prefix = " [" + secondary_tok.strings.prefix;
												}
												primary_tok.strings[key] = this.strings[key];
											}
										}
										state.output.append(primary, primary_tok);
										state.output.append(secondary, secondary_tok);
									} else {
										state.output.append(primary, this);
									}
								}
							};
						}
					} else if (this.variables[0] === "page-first") {
						func = function (state, Item) {
							var idx;
							value = state.getVariable(Item, "page", form);
							idx = value.indexOf("-");
							if (idx > -1) {
								value = value.slice(0, idx);
							}
							state.output.append(value, this);
						};
					} else if (this.variables[0] === "page") {
						func = function (state, Item) {
							value = state.getVariable(Item, "page", form);
							value = state.fun.page_mangler(value);
							state.output.append(value, this);
						};
					} else if (["publisher", "publisher-place"].indexOf(this.variables[0] > -1)) {
						func = function (state, Item) {
							value = state.getVariable(Item, this.variables[0]);
							if (value) {
								value = state.getTextSubField(value, "default-locale", true);
								state.output.append(value, this);
							}
						};
					} else {
						func = function (state, Item) {
							var value = state.getVariable(Item, this.variables[0], form);
							state.output.append(value, this);
						};
					}
					this.execs.push(func);
				} else if (this.strings.value) {
					func = function (state, Item) {
						var flag;
						flag = state.tmp.term_sibling.value();
						flag[0] = true;
						state.tmp.term_sibling.replace(flag);
						state.output.append(this.strings.value, this);
					};
					this.execs.push(func);
					// otherwise no output
				}
			}
			func = function (state, Item) {
				state.parallel.CloseVariable();
			};
			this.execs.push(func);
			target.push(this);
		}
		CSL.Util.substituteEnd.call(this, state, target);
	}
};


