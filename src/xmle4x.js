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
dojo.provide("csl.xmle4x");

/**
 * Functions for parsing an XML object using E4X.
 */
CSL.System.Xml.E4X = function(){};

/**
 * E4X can't handle XML declarations, so we lose them here.
 */
CSL.System.Xml.E4X.prototype.clean = function(xml){
	xml = xml.replace(/<\?[^?]+\?>/g,"");
	xml = xml.replace(/<![^>]+>/g,"");
	xml = xml.replace(/^\s+/g,"");
	xml = xml.replace(/\s+$/g,"");
	return xml;
};


/**
 * Methods to call on a node.
 */
CSL.System.Xml.E4X.prototype.children = function(myxml){
	var ret = myxml.children();
	return ret;
};

CSL.System.Xml.E4X.prototype.nodename = function(myxml){
	return myxml.localName();
};

CSL.System.Xml.E4X.prototype.attributes = function(myxml){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	var ret = new Object();
	var attrs = myxml.attributes();
	for each (var attr in attrs){
		var key = "@"+attr.localName();
		//
		// Needed in rhino
		//
		if (key.slice(0,5) == "@e4x_"){
			continue;
		}
		var value = attr;
		ret[key] = value;
	}
	return ret;
};


CSL.System.Xml.E4X.prototype.content = function(myxml){
	return myxml.toString();
};


CSL.System.Xml.E4X.prototype.namespace = {
	"xml":"http://www.w3.org/XML/1998/namespace"
}

CSL.System.Xml.E4X.prototype.numberofnodes = function(myxml){
	return myxml.length();
};

CSL.System.Xml.E4X.prototype.getAttributeName = function(attr){
	return attr.localName();
}

CSL.System.Xml.E4X.prototype.getAttributeValue = function(myxml,name,namespace){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	//
	// Oh, okay, I get it.  The syntax does not lend itself to parameterization,
	// but one of the elements is a variable, so it can be set before
	// the call.  Jeez but this feels ugly.  Does work, though.
	//
	if (namespace){
		var ns = new Namespace(this.namespace[namespace]);
		var ret = myxml.@ns::[name].toString();
	} else {
		if (name){
			var ret = myxml.attribute(name).toString();
		} else {
			var ret = myxml.toString();
		}
	}
	return ret;
}

CSL.System.Xml.E4X.prototype.getNodeValue = function(myxml,name){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	if (name){
		return myxml[name].toString();
	} else {
		return myxml.toString();
	}
}

CSL.System.Xml.E4X.prototype.setAttributeOnNodeIdentifiedByNameAttribute = function(myxml,nodename,attrname,attr,val){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	if (attr[0] != '@'){
		attr = '@'+attr;
	}
	myxml[nodename].(@name == attrname)[0][attr] = val;
}

CSL.System.Xml.E4X.prototype.deleteNodeByNameAttribute = function(myxml,val){
	delete myxml.*.(@name==val)[0];
}

CSL.System.Xml.E4X.prototype.deleteAttribute = function(myxml,attr){
	delete myxml["@"+attr];
}

CSL.System.Xml.E4X.prototype.setAttribute = function(myxml,attr,val){
	myxml['@'+attr] = val;
}

CSL.System.Xml.E4X.prototype.nodeCopy = function(myxml){
	return myxml.copy();
}

CSL.System.Xml.E4X.prototype.getNodesByName = function(myxml,name,nameattrval){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	var ret = myxml.descendants(name);
	if (nameattrval){
		ret = ret.(@name == nameattrval);
	}
	return ret;
}

CSL.System.Xml.E4X.prototype.nodeNameIs = function(myxml,name){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	if (myxml.localName().toString() == name){
		return true;
	}
	return false;
}

CSL.System.Xml.E4X.prototype.makeXml = function(str){
	default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
	var xml = new Namespace("http://www.w3.org/XML/1998/namespace");
	if (str){
		str = str.replace(/\s*<\?[^>]*\?>\s*\n*/g, "");
		//print("has xml content");
		var ret = new XML(str);
	} else {
		//print("no xml content");
		var ret = new XML();
	}
	return ret;
};
