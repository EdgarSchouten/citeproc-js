/*
 * Copyright (c) Frank G. Bennett, Jr. 2009. All Rights Reserved.
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
 * Copyright (c) Frank G. Bennett, Jr. 2009. All Rights Reserved.
 */
CSL.Node.name = new function(){
	this.build = build;
	function build(state,target){

		if ([CSL.SINGLETON, CSL.START].indexOf(this.tokentype) > -1){
			state.fixOpt(this,"name-delimiter","delimiter");
			state.fixOpt(this,"name-form","form");
			//
			// Okay, there's a problem with these.  Each of these is set
			// on the name object, but must be accessible at the closing of
			// the enclosing names object.  How did I do this before?
			//
			// Boosting to tmp seems to be the current strategy, and although
			// that's very messy, it does work.  It would be simple enough
			// to extend the function applied to initialize-with below (which
			// tests okay) to the others.  Probably that's the best short-term
			// solution.
			//
			// The boost to tmp could be a boost to build, instead.  That would
			// limit the jiggery-pokery and overhead to the compile phase.
			// Might save a few trees, in aggregate.
			//
			state.fixOpt(this,"and","and");
			state.fixOpt(this,"delimiter-precedes-last","delimiter-precedes-last");
			state.fixOpt(this,"initialize-with","initialize-with");
			state.fixOpt(this,"name-as-sort-order","name-as-sort-order");
			state.fixOpt(this,"sort-separator","sort-separator");

			state.fixOpt(this,"et-al-min","et-al-min");
			state.fixOpt(this,"et-al-use-first","et-al-use-first");
			state.fixOpt(this,"et-al-subsequent-min","et-al-subsequent-min");
			state.fixOpt(this,"et-al-subsequent-use-first","et-al-subsequent-use-first");

			state.build.nameattrs = new Object();
			for each (attrname in CSL.NAME_ATTRIBUTES){
				state.build.nameattrs[attrname] = this.strings[attrname];
			}

			state.build.form = this.strings.form;
			state.build.name_flag = true;

			var set_et_al_params = function(state,Item){
				if (Item.position || state.tmp.force_subsequent){
					if (! state.tmp["et-al-min"]){
						if (this.strings["et-al-subsequent-min"]){
							state.tmp["et-al-min"] = this.strings["et-al-subsequent-min"];
						} else {
							state.tmp["et-al-min"] = this.strings["et-al-min"];
						}
					}
					if (! state.tmp["et-al-use-first"]){
						if (this.strings["et-al-subsequent-use-first"]){
							state.tmp["et-al-use-first"] = this.strings["et-al-subsequent-use-first"];
						} else {
							state.tmp["et-al-use-first"] = this.strings["et-al-use-first"];
						}
					}
				} else {
					if (! state.tmp["et-al-min"]){
						state.tmp["et-al-min"] = this.strings["et-al-min"];
					}
					if (! state.tmp["et-al-use-first"]){
						state.tmp["et-al-use-first"] = this.strings["et-al-use-first"];
					}
				}
			};
			this["execs"].push(set_et_al_params);

			var func = function(state,Item){
				state.output.addToken("name",false,this);
			};
			this["execs"].push(func);

			//var set_initialize_with = function(state,Item){
			//	state.tmp["initialize-with"] = this.strings["initialize-with"];
			//};
			//this["execs"].push(set_initialize_with);

		}

		target.push(this);
	};
};


