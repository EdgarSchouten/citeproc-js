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
dojo.provide("csl.render");


/**
 * Get the undisambiguated version of a cite, without decorations
 * <p>This is used internally by the Registry.</p>
 */
CSL.getAmbiguousCite = function(Item,disambig){
	if (disambig){
		this.tmp.disambig_request = disambig;
	} else {
		this.tmp.disambig_request = false;
	}
	this.tmp.area = "citation";
	this.tmp.suppress_decorations = true;
	this.tmp.force_subsequent = true;
	CSL.getCite.call(this,Item);
	this.tmp.force_subsequent = false;
	var ret = this.output.string(this,this.output.queue);
	this.tmp.suppress_decorations = false;
	if (false){
		CSL.debug("ok");
	}
	return ret;
}

CSL.composeItem = function(Item,params){
	var newItem = {};
	for (var i in Item){
		newItem[i] = Item[i];
	}
	for (var i in params){
		newItem[i] = params[i];
	}
	return newItem;
};

/**
 * Get the sort key of an item, without decorations
 * <p>This is used internally by the Registry.</p>
 */
CSL.getSortKeys = function(Item,key_type){
	if (false){
		CSL.debug("KEY TYPE: "+key_type);
	}
	var area = this.tmp.area;
	var strip_prepositions = CSL.Util.Sort.strip_prepositions;
	this.tmp.area = key_type;
	this.tmp.disambig_override = true;
	this.tmp.disambig_request = false;
	this.tmp.suppress_decorations = true;
	CSL.getCite.call(this,Item);
	this.tmp.suppress_decorations = false;
	this.tmp.disambig_override = false;
	for (var i in this[key_type].keys){
		this[key_type].keys[i] = strip_prepositions(this[key_type].keys[i]);
	}
	if (false){
		CSL.debug("sort keys ("+key_type+"): "+this[key_type].keys);
	}
	this.tmp.area = area;
	return this[key_type].keys;
};

/**
 * Return current base configuration for disambiguation
 */
CSL.getAmbigConfig = function(){
	var config = this.tmp.disambig_request;
	if (!config){
		config = this.tmp.disambig_settings;
	}
	var ret = CSL.Factory.cloneAmbigConfig(config);
	return ret;
};


/**
 * Return max values for disambiguation
 */
CSL.getMaxVals = function(){
	return this.tmp.names_max.mystack.slice();
};

/**
 * Return min value for disambiguation
 */
CSL.getMinVal = function(){
	return this.tmp["et-al-min"];
};

/**
 * Return delimiter for use in join
 * <p>Splice evaluation is done during cite
 * rendering, and this method returns the
 * result.  Evaluation requires three items
 * of information from the preceding cite, if
 * one is present: the names used; the years
 * used; and the suffix appended to the
 * citation.  These details are copied into
 * the state object before processing begins,
 * and are cleared by the processor on
 * completion of the run.</p>
 */

CSL.getSpliceDelimiter = function(last_collapsed){
	if (last_collapsed && ! this.tmp.have_collapsed && this["citation"].opt["after-collapse-delimiter"]){
		this.tmp.splice_delimiter = this["citation"].opt["after-collapse-delimiter"];
	}
	return this.tmp.splice_delimiter;
};

/**
 * Return available modes for disambiguation
 */
CSL.getModes = function(){
	var ret = new Array();
	if (this[this.tmp.area].opt["disambiguate-add-names"]){
		ret.push("names");
	}
	var dagopt = this[this.tmp.area].opt["disambiguate-add-givenname"];
	var gdropt = this[this.tmp.area].opt["givenname-disambiguation-rule"];
	//
	// Use by-cite disambiguation for everything, for starters.
	//
	// hmm.  don't need any name expansion with the primary-name
	// disambiguate-add-givenname, so no givens in that case.
	if (dagopt){
		if (!gdropt || ("string" == typeof gdropt && "primary-name" != gdropt.slice(0,12))){
			ret.push("givens");
		};
	}
	return ret;
};


/*
 * Compose individual cites into a single string.
 */
CSL.getBibliographyEntries = function (bibsection){
	var ret = [];
	this.tmp.area = "bibliography";
	var input = this.retrieveItems(this.registry.getSortedIds());
	this.tmp.disambig_override = true;
	function eval_string(a,b){
		if (a == b){
			return true;
		}
		return false;
	}
	function eval_list(a,lst){
		for each (var b in lst){
			if (eval_string(a,b)){
				return true;
			}
		}
		return false;
	}
	function eval_spec(a,b){
		if ((a == "none" || !a) && !b){
			return true;
		}
		if ("string" == typeof b){
			return eval_string(a,b);
		} else {
			return eval_list(a,b);
		}
	}
	for each (var item in input){
		if (bibsection){
			var include = true;
			if (bibsection.include){
				//
				// Opt-in: these are OR-ed.
				//
				include = false;
				for each (spec in bibsection.include){
					if (eval_spec(spec.value,item[spec.field])){
						include = true;
						break;
					}
				}
			} else if (bibsection.exclude){
				//
				// Opt-out: these are also OR-ed.
				//
				var anymatch = false;
				for each (spec in bibsection.exclude){
					if (eval_spec(spec.value,item[spec.field])){
						anymatch = true;
						break;
					}
				}
				if (anymatch){
					include = false;
				}
			} else if (bibsection.select){
				//
				// Multiple condition opt-in: these are AND-ed.
				//
				include = false;
				var allmatch = true;
				for each (spec in bibsection.select){
					if (!eval_spec(spec.value,item[spec.field])){
						allmatch = false;
					}
				}
				if (allmatch){
					include = true;
				}
			}
			if (bibsection.quash){
				//
				// Stop criteria: These are AND-ed.
				//
				var allmatch = true;
				for each (spec in bibsection.quash){
					if (!eval_spec(spec.value,item[spec.field])){
						allmatch = false;
					}
				}
				if (allmatch){
					include = false;
				}
			}
			if ( !include ){
				continue;
			}
		}
		if (false){
			CSL.debug("BIB: "+item.id);
		}
		var bib_entry = new CSL.Factory.Token("group",CSL.START);
		bib_entry.decorations = [["@bibliography","entry"]];
		this.output.startTag("bib_entry",bib_entry);
		CSL.getCite.call(this,item);
		this.output.endTag(); // closes bib_entry
		ret.push(this.output.string(this,this.output.queue)[0]);
	}
	this.tmp.disambig_override = false;
	return ret;
};

/*
 * Compose individual cites into a single string, with
 * flexible inter-cite splicing.
 */
CSL.getCitationCluster = function (inputList){
	this.tmp.area = "citation";
	var delimiter = "";
	var result = "";
	var objects = [];
	this.tmp.last_suffix_used = "";
	this.tmp.last_names_used = new Array();
	this.tmp.last_years_used = new Array();

	for each (var Item in inputList){
		var last_collapsed = this.tmp.have_collapsed;
		CSL.getCite.call(this,Item);
		CSL.getSpliceDelimiter.call(this,last_collapsed);
		this.tmp.handle_ranges = true;
		if (Item["author-only"]){
			this.tmp.suppress_decorations = true;
		}
		var composite = this.output.string(this,this.output.queue);
		this.tmp.suppress_decorations = false;
		this.tmp.handle_ranges = false;
		if (Item["author-only"]){
			return composite;
		}
		if (objects.length && "string" == typeof composite[0]){
			composite.reverse();
			objects.push(this.tmp.splice_delimiter + composite.pop());
		} else {
			composite.reverse();
			var compie = composite.pop();
			if ("undefined" != typeof compie){
				objects.push(compie);
			};
		}
		composite.reverse();
		for each (var obj in composite){
			if ("string" == typeof obj){
				objects.push(this.tmp.splice_delimiter + obj);
				continue;
			}
			var compie = composite.pop();
			if ("undefined" != typeof compie){
				objects.push(compie);
			};
		};
	};
	result += this.output.renderBlobs(objects)[0];
	if (result){
		result = this.citation.opt.layout_prefix + result + this.citation.opt.layout_suffix;
		if (!this.tmp.suppress_decorations){
			for each (var params in this.citation.opt.layout_decorations){
				result = this.fun.decorate[params[0]][params[1]](this,result);
			};
		};
	};
	return result;
};


/*
 * Render a single cite item.
 *
 * This is called on the state object, with a single
 * Item as input.  It iterates exactly once over the style
 * citation tokens, and leaves the result of rendering in
 * the top-level list in the relevant *.opt.output
 * stack, as a list item consisting of a single string.
 *
 * (This might be dual-purposed for generating individual
 * entries in a bibliography.)
 */
CSL.getCite = function(Item){
	CSL.citeStart.call(this,Item);
	var next = 0;
	while(next < this[this.tmp.area].tokens.length){
		next = CSL.tokenExec.call(this,this[this.tmp.area].tokens[next],Item);
    }
	CSL.citeEnd.call(this,Item);
};

/*
 * Render one style token.
 *
 * This is called on a token, with the state object
 * and an Item object as arguments.
 */
CSL.tokenExec = function(token,Item){
    var next = token.next;
	var maybenext = false;
	if (false){
		CSL.debug("---> Token: "+token.name+" ("+token.tokentype+") in "+this.tmp.area+", "+this.output.current.mystack.length);
	}

	if (token.evaluator){
	    next = token.evaluator(token,this,Item);
    };
	for each (var exec in token.execs){
	    maybenext = exec.call(token,this,Item);
		if (maybenext){
			next = maybenext;
		};
	};
	if (false){
		CSL.debug(token.name+" ("+token.tokentype+") ---> done");
	}
	return next;
};

CSL.citeStart = function(Item){
	this.tmp.have_collapsed = true;
	this.tmp.render_seen = false;
	if (this.tmp.disambig_request  && ! this.tmp.disambig_override){
		this.tmp.disambig_settings = this.tmp.disambig_request;
	} else if (this.registry.registry[Item.id] && ! this.tmp.disambig_override) {
		this.tmp.disambig_request = this.registry.registry[Item.id].disambig;
		this.tmp.disambig_settings = this.registry.registry[Item.id].disambig;
	} else {
		this.tmp.disambig_settings = new CSL.Factory.AmbigConfig();
	}
	this.tmp.names_used = new Array();
	this.tmp.nameset_counter = 0;
	this.tmp.years_used = new Array();

	this.tmp.splice_delimiter = this[this.tmp.area].opt.delimiter;

	this["bibliography_sort"].keys = new Array();
	this["citation_sort"].keys = new Array();

	this.tmp.count_offset_characters = false;
	this.tmp.offset_characters = 0;
	//
	// Oh ... shucks.  This is difficult.  We need to be able to
	// unwind this thing, so the derived values should really go into
	// registry, and the max be taken each time the data is delivered
	// back to the client.  Sucks, but will be robust and amazing that
	// way, so that's what we should do.
};

CSL.citeEnd = function(Item){

	if (this.tmp.last_suffix_used && this.tmp.last_suffix_used.match(/.*[-.,;:]$/)){
		this.tmp.splice_delimiter = " ";
	} else if (this.tmp.prefix.value() && this.tmp.prefix.value().match(/^[,,:;a-z].*/)){
		this.tmp.splice_delimiter = " ";
	}

	this.tmp.last_suffix_used = this.tmp.suffix.value();
	this.tmp.last_years_used = this.tmp.years_used.slice();
	this.tmp.last_names_used = this.tmp.names_used.slice();

	this.tmp.disambig_request = false;
	if (!this.tmp.suppress_decorations && this.tmp.offset_characters){
		this.registry.registry[Item.id].offset = this.tmp.offset_characters;
	}
};
