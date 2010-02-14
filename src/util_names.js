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
CSL.Util.Names = new function(){};

/**
 * Build a set of names, less any label or et al. tag
 */
CSL.Util.Names.outputNames = function(state,display_names){

	var segments = new this.StartMiddleEnd(state,display_names);
	var and = state.output.getToken("name").strings.delimiter;
	if (state.output.getToken("name").strings["delimiter-precedes-last"] == "always"){
		and = state.output.getToken("inner").strings.delimiter+and;
	} else if (state.output.getToken("name").strings["delimiter-precedes-last"] == "never"){
		if (!and){
			and = state.output.getToken("inner").strings.delimiter;
		}
	} else if ((segments.segments.start.length + segments.segments.middle.length) > 1){
		and = state.output.getToken("inner").strings.delimiter+and;
	} else {
		if (!and){
			and = state.output.getToken("inner").strings.delimiter;
		}
	}
	if (and.match(CSL.STARTSWITH_ROMANESQUE_REGEXP)){
		and = " "+and;
	}
	if (and.match(CSL.ENDSWITH_ROMANESQUE_REGEXP)){
		and = and+" ";
	}
	state.output.getToken("name").strings.delimiter = and;

	state.output.openLevel("name");
	state.output.openLevel("inner");
	segments.outputSegmentNames("start");
	segments.outputSegmentNames("middle");
	state.output.closeLevel(); // inner
	segments.outputSegmentNames("end");
	state.output.closeLevel(); // name
};

CSL.Util.Names.StartMiddleEnd = function(state,names){
	this.state = state;
	this.nameoffset = 0;
	//
	// what to do here?  we need config for this, tokens to
	// control the joining that will come.  how do we get
	// them into this function?
	var start = names.slice(0,1);
	var middle = names.slice(1,(names.length-1));
	var endstart = 1;
	if (names.length > 1){
		endstart = (names.length-1);
	}
	var end = names.slice(endstart,(names.length));
	var ret = {};
	ret["start"] = start;
	ret["middle"] = middle;
	ret["end"] = end;
	this.segments = ret;
};

CSL.Util.Names.StartMiddleEnd.prototype.outputSegmentNames = function(seg){
	var state = this.state;
	for (var namenum in this.segments[seg]){
		this.namenum = parseInt(namenum,10);
		this.name = this.segments[seg][namenum];
		if (this.name.literal){
			var value = this.name.literal;
			state.output.append(this.name.literal,"empty");
		} else {
			var sequence = CSL.Util.Names.getNamepartSequence(state,seg,this.name);

			state.output.openLevel(sequence[0][0]);
			state.output.openLevel(sequence[0][1]);
			state.output.openLevel(sequence[0][2]);
			this.outputNameParts(sequence[1]);

			state.output.closeLevel();
			state.output.openLevel(sequence[0][2]);

			this.outputNameParts(sequence[2]);

			state.output.closeLevel();
			state.output.closeLevel();
			//
			// articular goes here  //
			//
			this.outputNameParts(sequence[3]);

			state.output.closeLevel();
		}
	};
	this.nameoffset += this.segments[seg].length;
}

CSL.Util.Names.StartMiddleEnd.prototype.outputNameParts = function(subsequence){
	var state = this.state;
	for each (var key in subsequence){
		var namepart = this.name[key];
		if (("given" == key || "suffix" == key) && !this.name["static-ordering"]){
			if (0 == state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][(this.namenum+this.nameoffset)]){
				continue;
			} else if ("given" == key && 1 == state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][(this.namenum+this.nameoffset)]){
				var initialize_with = state.output.getToken("name").strings["initialize-with"];
				namepart = CSL.Util.Names.initializeWith(state,namepart,initialize_with);
			}
		}
		state.output.append(namepart,key);
	}
}

CSL.Util.Names.getNamepartSequence = function(state,seg,name){
	var token = state.output.getToken("name");
	// Set the rendering order and separators of the core nameparts
	// sequence[0][0] separates elements inside each of the the two lists
	// sequence[0][1] separates the two lists
	if (name.comma_suffix){
		var suffix_sep = "commasep";
	} else {
		var suffix_sep = "space";
	}
	var romanesque = name["family"].match(CSL.ROMANESQUE_REGEXP);
	if (!romanesque ){ // neither roman nor Cyrillic characters
		var sequence = [["empty","empty","empty"],["non-dropping-particle", "family"],["given"],[]];
	} else if (name["static-ordering"]) { // entry likes sort order
		var sequence = [["space","space","space"],["non-dropping-particle", "family"],["given"],[]];
	} else if (state.tmp.sort_key_flag){
		if (state.opt["demote-non-dropping-particle"] == "never"){
			var sequence = [["space","sortsep","space"],["non-dropping-particle","family","dropping-particle"],["given"],["suffix"]];
		} else {
			var sequence = [["space","sortsep","space"],["family"],["given","dropping-particle","non-dropping-particle"],["suffix"]];
		};
	} else if (token && ( token.strings["name-as-sort-order"] == "all" || (token.strings["name-as-sort-order"] == "first" && seg == "start"))){
		//
		// Discretionary sort ordering and inversions
		//
		if (state.opt["demote-non-dropping-particle"] == "always"){
			var sequence = [["sortsep","sortsep","space"],["family"],["given","dropping-particle","non-dropping-particle"],["suffix"]];
		} else {
			var sequence = [["sortsep","sortsep","space"],["non-dropping-particle","family"],["given","dropping-particle"],["suffix"]];
		};
	} else { // plain vanilla
		var sequence = [[suffix_sep,"space","space"],["given"],["dropping-particle","non-dropping-particle","family"],["suffix"]];
	}
	return sequence;
};

CSL.Util.Names.deep_copy = function(nameset){
	var nameset2 = new Array();
	for each (name in nameset){
		var name2 = new Object();
		for (var i in name){
			name2[i] = name[i];
		}
		nameset2.push(name2);
	}
	return nameset2;
}


/**
 * Reinitialize scratch variables used by names machinery.
 */
//
// XXXX A handy guide to variable assignments that need
// XXXX to be eliminated.  :)
//
CSL.Util.Names.reinit = function(state,Item){
	state.tmp.value = new Array();
	state.tmp.name_et_al_term = false;
	state.tmp.name_et_al_decorations = false;


	state.tmp.name_et_al_form = "long";
	state.tmp.et_al_prefix = false;
};

CSL.Util.Names.getCommonTerm = function(state,namesets){
	if (namesets.length < 2){
		return false;
	}
	var base_nameset = namesets[0];
	var varnames = new Array();
	if (varnames.indexOf(base_nameset.type) == -1){
		varnames.push(base_nameset.type);
	}
	for each (nameset in namesets.slice(1)){
		if (!CSL.Util.Names.compareNamesets(base_nameset,nameset)){
			return false;
		}
		if (varnames.indexOf(nameset.type) == -1){
			varnames.push(nameset.type);
		}
	}
	varnames.sort();
	return varnames.join("");
};


CSL.Util.Names.compareNamesets = function(base_nameset,nameset){
	if (base_nameset.length != nameset.length){
		return false;
	}
	var name;
	for (var n in nameset.names){
		name = nameset.names[n];
		for each (var part in ["family","given","dropping-particle","non-dropping-particle","suffix"]){
			if (!base_nameset.names[n] || base_nameset.names[n][part] != name[part]){
				return false;
			}
		}
	}
	return true;
};


/**
 * Initialize a name.
 */
CSL.Util.Names.initializeWith = function(state,name,terminator){
	if (!name){
		return "";
	};
	var namelist = name;
	if (state.opt["initialize-with-hyphen"] == false){
		namelist = namelist.replace(/\-/g," ");
	}
	namelist = namelist.replace(/\./g," ").replace(/\s*\-\s*/g,"-").replace(/\s+/g," ").split(/(\-|\s+)/);
	var l = namelist.length;
	for (var i=0; i<l; i+=2){
		var n = namelist[i];
		var m = n.match( CSL.NAME_INITIAL_REGEXP);
		if (m && m[1] == m[1].toUpperCase()){
			var extra = "";
			// extra upper-case characters also included
			if (m[2]){
				var s = "";
				for each (var c in m[2].split("")){
					if (c == c.toUpperCase()){
						s += c;
					} else {
						break;
					}
				}
				if (s.length < m[2].length){
					extra = s.toLocaleLowerCase();
				};
			}
			namelist[i] = m[1].toLocaleUpperCase() + extra;
			if (i < (namelist.length-1)){
				if (namelist[(i+1)].indexOf("-") > -1){
					namelist[(i+1)] = terminator + namelist[(i+1)];
				} else {
					namelist[(i+1)] = terminator;
				}
			} else {
				namelist.push(terminator);
			}
		} else if (n.match(CSL.ROMANESQUE_REGEXP)){
			// romanish things that began with lower-case characters don't get initialized ...
			namelist[i] = " "+n;
		};
	};
	var ret = CSL.Util.Names.stripRight( namelist.join("") );
	ret = ret.replace(/\s*\-\s*/g,"-").replace(/\s+/g," ");
	return ret;
};


CSL.Util.Names.stripRight = function(str){
	var end = 0;
	for (var pos=(str.length-1); pos > -1; pos--){
		if (str[pos] != " "){
			end = (pos+1);
			break;
		};
	};
	return str.slice(0,end);
};


CSL.Util.Names.rescueNameElements = function(names){
	for (var name in names){
		if (names[name]["given"]){
			if (names[name]["given"].indexOf(",") > -1){
				var m = names[name]["given"].match(/(.*),(!?)\s*(.*)/);
				names[name]["given"] = m[1];
				if (m[2]){
					names[name]["comma_suffix"] = true;
				}
				names[name]["suffix"] = m[3];
			};
			var m = names[name]["given"].match(/(.*?)\s+([ a-z]+)$/);
			if (m){
				names[name]["given"] = m[1];
				names[name]["prefix"] = m[2];
			}
		};
	};
	return names;
};
