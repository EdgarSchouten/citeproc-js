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

CSL.tokenExec = function(token,Item,item){
    var next = token.next;
	var maybenext = false;
	if (false){
		CSL.debug("---> Token: "+token.name+" ("+token.tokentype+") in "+this.tmp.area+", "+this.output.current.mystack.length);
	}

	if (token.evaluator){
	    next = token.evaluator(token,this,Item,item);
    };
	for each (var exec in token.execs){
	    maybenext = exec.call(token,this,Item,item);
		if (maybenext){
			next = maybenext;
		};
	};
	if (false){
		CSL.debug(token.name+" ("+token.tokentype+") ---> done");
	}
	return next;
};

/**
 * Macro expander.
 * <p>Called on the state object.</p>
 */
CSL.expandMacro = function(macro_key_token){
	var mkey = macro_key_token.postponed_macro;
	if (this.build.macro_stack.indexOf(mkey) > -1){
		throw "CSL processor error: call to macro \""+mkey+"\" would cause an infinite loop";
	} else {
		this.build.macro_stack.push(mkey);
	}
	var start_token = new CSL.Token("group",CSL.START);
	start_token.decorations = this.decorations;
	for (var i in macro_key_token.strings){
		start_token.strings[i] = macro_key_token.strings[i];
	}
	var newoutput = function(state,Item){
		//state.output.openLevel(this);
		state.output.startTag("group",this);
		//state.tmp.decorations.push(this.decorations);
	};
	start_token["execs"].push(newoutput);
	this[this.build.area].tokens.push(start_token);
	//
	// Here's where things change pretty dramatically.  We pull
	// macros out of E4X directly, and process them using the
	// same combination of tree walker and tag processor that
	// led us here, but with a different queue.
	//
	// Xml: get list of nodes by attribute match
	//
	var macroxml = this.sys.xml.getNodesByName( this.cslXml, 'macro', mkey);
	//
	// Xml: test for node existence
	//
	if (!this.sys.xml.getNodeValue( macroxml) ){
		throw "CSL style error: undefined macro \""+mkey+"\"";
	}
	var navi = new this._getNavi( this, macroxml );
	CSL.buildStyle.call(this,navi);

	var end_token = new CSL.Token("group",CSL.END);
	var mergeoutput = function(state,Item){
		//
		// rendering happens inside the
		// merge method, by applying decorations to
		// each token to be merged.
		state.output.endTag();
		//state.output.closeLevel();
	};
	end_token["execs"].push(mergeoutput);
	this[this.build.area].tokens.push(end_token);

	this.build.macro_stack.pop();
};



/**
 * Convert XML node to token.
 * <p>This is called on an XML node.  After extracting the name and attribute
 * information from the node, it performs three operations.  Attribute information
 * relating to output formatting is stored on the node as an array of tuples,
 * which fixes the sequence of execution of output functions to be invoked
 * in the next phase of processing.  Other attribute information is reduced
 * to functions, and is pushed into an array on the token in no particular
 * order, for later execution.  The element name is used as a key to
 * invoke the relevant <code>build</code> method of the target element.
 * Element methods are defined in {@link CSL.Node}.</p>
 * @param {Object} state  The state object returned by {@link CSL.Engine}.
 * @param {Int} tokentype  A CSL namespace constant (<code>CSL.START</code>,
 * <code>CSL.END</code> or <code>CSL.SINGLETON</code>.
 */
CSL.XmlToToken = function(state,tokentype){
	var name = state.sys.xml.nodename(this);
	// CSL.debug(tokentype + " : " + name);
	if (state.build.skip && state.build.skip != name){
		return;
	}
	if (!name){
		var txt = state.sys.xml.content(this);
		if (txt){
			state.build.text = txt;
		}
		return;
	}
	if ( ! CSL.Node[state.sys.xml.nodename(this)]){
		throw "Undefined node name \""+name+"\".";
	}
	var attrfuncs = new Array();
	var attributes = state.sys.xml.attributes(this);
	var decorations = CSL.setDecorations.call(this,state,attributes);
	var token = new CSL.Token(name,tokentype);
	if (tokentype != CSL.END){
	//
	// xml: more xml stuff
	//
	for (var key in attributes){
		try {
			CSL.Attributes[key].call(token,state,""+attributes[key]);
		} catch (e) {
			if (e == "TypeError: Cannot call method \"call\" of undefined"){
				throw "Unknown attribute \""+key+"\" in node \""+name+"\" while processing CSL file";
			} else {
				throw "CSL processor error, "+key+" attribute: "+e;
			}
		}
	}
	token.decorations = decorations;
	}
	//
	// !!!!!: eliminate diversion of tokens to separate
	// token list (formerly used for reading in macros
	// and terms).
	//
	var target = state[state.build.area].tokens;
	CSL.Node[name].build.call(token,state,target);
};


