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

CSL.Node.key = new function(){
	this.build = build;
	function build(state,target){
		var start_key = new CSL.Token("key",CSL.START);
		start_key.strings["et-al-min"] = this.strings["et-al-min"];
		start_key.strings["et-al-use-first"] = this.strings["et-al-use-first"];
		var initialize_done_vars = function(state,Item){
			state.tmp.done_vars = new Array();
		};
		start_key.execs.push(initialize_done_vars);

		var sort_direction = new Array();
		if (this.strings.sort_direction == CSL.DESCENDING){
			sort_direction.push(1);
			sort_direction.push(-1);
		} else {
			sort_direction.push(-1);
			sort_direction.push(1);
		}
		state[state.build.area].opt.sort_directions.push(sort_direction);

		var et_al_init = function(state,Item){
			state.tmp.sort_key_flag = true;
			if (this.strings["et-al-min"]){
				state.tmp["et-al-min"] = this.strings["et-al-min"];
			}
			if (this.strings["et-al-use-first"]){
				state.tmp["et-al-use-first"] = this.strings["et-al-use-first"];
			}
		};
		start_key["execs"].push(et_al_init);
		target.push(start_key);
		//
		// ops to initialize the key's output structures
		if (this.variables.length){
			var variable = this.variables[0];
			if (CSL.CREATORS.indexOf(variable) > -1) {
				//
				// Start tag
				var names_start_token = new CSL.Token("names",CSL.START);
				names_start_token.tokentype = CSL.START;
				names_start_token.variables = this.variables;
				CSL.Node.names.build.call(names_start_token,state,target);
				//
				// Middle tag
				var name_token = new CSL.Token("name",CSL.SINGLETON);
				name_token.tokentype = CSL.SINGLETON;
				name_token.strings["name-as-sort-order"] = "all";
				CSL.Node.name.build.call(name_token,state,target);
				//
				// End tag
				var names_end_token = new CSL.Token("names",CSL.END);
				names_end_token.tokentype = CSL.END;
				CSL.Node.names.build.call(names_end_token,state,target);
			} else {
				var single_text = new CSL.Token("text",CSL.SINGLETON);
				single_text.dateparts = this.dateparts;
				if (variable == "citation-number"){
					var output_func = function(state,Item){
						state.output.append(state.registry.registry[Item["id"]].seq.toString(),"empty");
					};
				} else if (CSL.DATE_VARIABLES.indexOf(variable) > -1) {
					var output_func = function(state,Item){
						var dp = Item[variable];
						if ("undefined" == typeof dp){
							dp = {"date-parts": [[0]] };
							if (!dp["year"] && state.tmp.area == "bibliography_sort"){
								state.tmp.empty_date = true;
							};
						};
						if ("undefined" == typeof this.dateparts){
							this.dateparts = ["year","month","day"];
						}
						if (dp.raw){
							dp = state.dateParseRaw( dp.raw );
						} else if (dp["date-parts"]) {
							dp = state.dateParseArray( dp );
						};
						if ("undefined" == typeof dp){
							dp = {};
						};
						for each (var elem in ["year","month","day","year_end","month_end","day_end"]){
							var value = 0;
							var e = elem;
							if (e.slice(-4) == "_end"){
								e = e.slice(0,-4);
							}
							if (dp[elem] && this.dateparts.indexOf(e) > -1){
								value = dp[elem];
							};
							if (elem.slice(0,4) == "year"){
								var yr = CSL.Util.Dates[e]["numeric"](state,value);
								var prefix = "Y";
								if (yr[0] == "-"){
									prefix = "X";
									yr = yr.slice(1);
									yr = 9999-parseInt(yr,10);
								}
								state.output.append(CSL.Util.Dates[elem.slice(0,4)]["numeric"](state,(prefix+yr)));
							} else {
								state.output.append(CSL.Util.Dates[e]["numeric-leading-zeros"](state,value));
							};
						};
					};
				} else if ("title" == variable) {
					var output_func = function(state,Item){
						var value = Item[variable];
						if (value){
							value = state.getTextSubField(value,"locale-sort",true);
							state.output.append(value,"empty");
						};
					};
				} else {
					var output_func = function(state,Item){
						state.output.append(Item[variable],"empty");
					};
				};
				single_text["execs"].push(output_func);
				target.push(single_text);
			};
		} else { // macro
			//
			// if it's not a variable, it's a macro
			var token = new CSL.Token("text",CSL.SINGLETON);
			token.postponed_macro = this.postponed_macro;
			var pos = target.length;
			var keypos = false;
			CSL.expandMacro.call(state,token);
			for (var ppos in target.slice(pos)){
				var tok = target.slice(pos)[ppos];
				if (tok && tok.name == "text" && tok.dateparts){
					keypos = ppos;
					break;
				};
			}
			if (keypos){
				var saveme = target[(parseInt(keypos,10)+parseInt(pos,10))];
				for (var xpos=(target.length-1);xpos > pos; xpos--){
					target.pop();
				}
				target.push(saveme);
				var gtok = new CSL.Token("group",CSL.END);
				target.push(gtok);
			}
		}
		//
		// ops to output the key string result to an array go
		// on the closing "key" tag before it is pushed.
		// Do not close the level.
		var end_key = new CSL.Token("key",CSL.END);
		var store_key_for_use = function(state,Item){
			var keystring = state.output.string(state,state.output.queue);
			if (false){
				CSL.debug("keystring: "+keystring+" "+typeof keystring);
			}
			if ("string" != typeof keystring || state.tmp.empty_date){
				keystring = undefined;
				state.tmp.empty_date = false;
			}
			state[state.tmp.area].keys.push(keystring);
			state.tmp.value = new Array();
		};
		end_key["execs"].push(store_key_for_use);
		var reset_key_params = function(state,Item){
			// state.tmp.name_quash = new Object();
			state.tmp["et-al-min"] = false;
			state.tmp["et-al-use-first"] = false;
			state.tmp.sort_key_flag = false;
		};
		end_key["execs"].push(reset_key_params);
		target.push(end_key);
	};
};
