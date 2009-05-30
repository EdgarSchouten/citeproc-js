dojo.provide("csl.tests");

/**
 * Retrieval methods for standard tests.
 */
var StdRhinoTest = function(myname){
	this.myname = myname;
	var test = readFile("./std/machines/" + myname + ".json");
	eval( "this.test = "+test);
	this._cache = {};
	this._ids = [];
	//
	// Normalize input and build style.
	//
	if (myname){
		this.result = this.test.result;
		this._fixAllNames();
		this._setCache();
		this._fixInputSets();
	}
};

//
// Retrieve properly composed item from phoney database.
// (Deployments must provide an instance object with
// this method.)
//
StdRhinoTest.prototype.retrieveItem = function(id){
	return this._cache[id];
};

//
// Retrieve properly composed items from phoney database.
// (Deployments must provide an instance object with
// this method.)
//
StdRhinoTest.prototype.retrieveItems = function(ids){
	var ret = [];
	for each (var id in ids){
		ret.push(this.retrieveItem(id));
	}
	return ret;
};

//
// Retrieve locale object from filesystem
// (Deployments must provide an instance object with
// this method.)
//
StdRhinoTest.prototype.getLang = function(lang){
	return readFile( "./locale/"+this.localeRegistry()[lang]);
};


StdRhinoTest.prototype.localeRegistry =	function (){
	return {
		"af":"locales-af-AZ.xml",
		"af":"locales-af-ZA.xml",
		"ar":"locales-ar-AR.xml",
		"bg":"locales-bg-BG.xml",
		"ca":"locales-ca-AD.xml",
		"cs":"locales-cs-CZ.xml",
		"da":"locales-da-DK.xml",
		"de":"locales-de-AT.xml",
		"de":"locales-de-CH.xml",
		"de":"locales-de-DE.xml",
		"el":"locales-el-GR.xml",
		"en":"locales-en-US.xml",
		"es":"locales-es-ES.xml",
		"et":"locales-et-EE.xml",
		"fr":"locales-fr-FR.xml",
		"he":"locales-he-IL.xml",
		"hu":"locales-hu-HU.xml",
		"is":"locales-is-IS.xml",
		"it":"locales-it-IT.xml",
		"ja":"locales-ja-JP.xml",
		"ko":"locales-ko-KR.xml",
		"mn":"locales-mn-MN.xml",
		"nb":"locales-nb-NO.xml",
		"nl":"locales-nl-NL.xml",
		"pl":"locales-pl-PL.xml",
		"pt":"locales-pt-BR.xml",
		"pt":"locales-pt-PT.xml",
		"ro":"locales-ro-RO.xml",
		"ru":"locales-ru-RU.xml",
		"sk":"locales-sk-SK.xml",
		"sl":"locales-sl-SI.xml",
		"sr":"locales-sr-RS.xml",
		"sv":"locales-sv-SE.xml",
		"th":"locales-th-TH.xml",
		"tr":"locales-tr-TR.xml",
		"uk":"locales-uk-UA.xml",
		"vi":"locales-vi-VN.xml",
		"zh":"locales-zh-CN.xml",
		"zh":"locales-zh-TW.xml"
	};
};

//
// Build phoney database.
//
StdRhinoTest.prototype._setCache = function(){
	for each (item in this.test.input){
		this._cache[item.id] = item;
		this._ids.push(item.id);
	}
};


StdRhinoTest.prototype._fixInputSets = function(){
	if (this.test.mode == "citation"){
		if (!this.test.citations){
			var citation = [];
			for each (item in this.test.input){
				citation.push([item.id,{}]);
			}
			this.test.citations = [citation];
		}
	}
};


StdRhinoTest.prototype._fixAllNames = function(){
	for each (obj in this.test.input){
		if (!obj.id){
			throw "No id for object in test: "+this.myname;
		}
		for each (key in CSL.CREATORS){
			if (obj[key]){
				for each (var entry in obj[key]){
					var one_char = entry.name.length-1;
					var two_chars = one_char-1;
					entry.sticky = false;
					if ("!!" == entry.name.substr(two_chars)){
						entry.literal = entry.name.substr(0,two_chars).replace(/\s+$/,"");
					} else {
						var parsed = entry.name;
						if ("!" == entry.name.substr(one_char)){
							entry.sticky = true;
							parsed = entry.name.substr(0,one_char).replace(/\s+$/,"");
						}
						parsed = parsed.split(/\s*,\s*/);

						if (parsed.length > 0){
							var m = parsed[0].match(/^\s*([a-z]+)\s+(.*)/);
							if (m){
								entry.prefix = m[1];
								entry["primary-key"] = m[2];
							} else {
								entry["primary-key"] = parsed[0];
							}
						}
						if (parsed.length > 1){
							entry["secondary-key"] = parsed[1];
						}
						if (parsed.length > 2){
							var m = parsed[2].match(/\!\s*(.*)/);
							if (m){
								entry.suffix = m[1];
								entry.comma_suffix = true;
							} else {
								entry.suffix = parsed[2];
							}
						}
					}
				}
			}
		}
	}
};

StdRhinoTest.prototype._readTest = function(){
	var test;
	var filename = "std/machines/" + this.myname + ".json";
	//
	// Half of the fix for encoding problem encountered by Sean
	// under OSX.  External strings are _read_ correctly, but an
	// explicit encoding declaration on readFile is needed if
	// they are to be fed to eval.  This may set the implicit
	// UTF-8 binary identifier on the stream, as defined in the
	// ECMAscript specification.  See http://www.ietf.org/rfc/rfc4329.txt
	//
	// Python it's not.  :)
	//
	var teststring = readFile(filename, "UTF-8");
	//
	// Grab test data in an object.
	//
	try {
		eval( "test = "+teststring );
	} catch(e){
		throw e + teststring;
	}
	this.test = test;
};


StdRhinoTest.prototype._buildStyle = function(){
	var builder = new CSL.Core.Build(this.test.csl);
	var raw = builder.build(this);
	var configurator = new CSL.Core.Configure(raw);
	this.style = configurator.configure();
};


StdRhinoTest.prototype.run = function(){
	this._buildStyle(this);
	this.style.insertItems(this._ids);
	if (this.test.mode == "citation"){
		var citations = [];
		for each (var citation in this.test.citations){
			citations.push(this.style.makeCitationCluster(citation));
		}
		var ret = citations.join("\n");
	} else if (this.test.mode == "bibliography"){
		var ret = this.style.makeBibliography();
	} else {
		throw "Invalid mode in test file "+this.myname+": "+this.test.mode;
	}
	return ret;
};


RhinoTest = function(name){
	this.dummy = [["dummy",{}]];
	this.citations = [];
	this.input = name;
	this.items = [];
	this._ids = [];
	this._cache = {};
	if (name){
		if ("string" == typeof name[0]){
			var input = this._getInput(name);
		} else {
			var input = name;
		}
		this.fixData(input);
	} else {
		this._ids.push("dummy");
		this._cache["dummy"] = {"id":"dummy"};
		this.citations.push(["dummy",{}]);
		this.items.push({"id":"dummy"});
	}
};

RhinoTest.prototype.fixData = function(Item){
	//
	// Item isn't really an item, it's a list of items.
	// And they need to be remangled to conform to the
	// processor API.
	//
	if (Item){
		var seqno = 100;
		this._ids = [];
		this._cache = {};
		this.citations = [];
		for (var i in Item){
			var realitem = Item[i];
			if (!realitem.id){
				realitem.id = "ITEM-"+seqno.toString();
				seqno += 1;
			}
			this._ids.push(realitem.id);
			this._cache[realitem.id] = realitem;
			this.citations.push([realitem.id,{}]);
			this.items.push(realitem);
		}
	}
};

RhinoTest.prototype.retrieveItem = function(id){
	return this._cache[id];
};

RhinoTest.prototype.retrieveItems = function(ids){
	var ret = [];
	for each (var id in ids){
		ret.push(this.retrieveItem(id));
	}
	return ret;
};

RhinoTest.prototype.getLang = function(lang){
	return readFile( "./locale/"+this.localeRegistry()[lang]);
};

RhinoTest.prototype._getInput = function(name){
	this.myname = name;
	var ret = new Array();
	if ("object" == typeof name && name.length){
		for each (filename in name){
			if (this.input[filename]){
				ret.push(this.input[filename]);
			} else {
				var datastring = readFile("data/" + filename + ".txt");
				eval( "obj = " + datastring );
				this._fixAllNames([obj]);
				this.input[filename] = obj;
				ret.push(obj);
			}
		}
	} else if ("object" == typeof name){
		if (this.input[filename]){
			ret.push(this.input[filename]);
		} else {
			var datastring = readFile("data/" + filename + ".txt");
			this.input[filename] = obj;
			eval( "obj = " + datastring );
			this._fixAllNames([obj]);
			ret.push(obj);
		}
	} else {
		throw "Failure reading test data file, WTF?";
	}
	return ret;
}

RhinoTest.prototype.localeRegistry =	function (){
	return {
		"af":"locales-af-AZ.xml",
		"af":"locales-af-ZA.xml",
		"ar":"locales-ar-AR.xml",
		"bg":"locales-bg-BG.xml",
		"ca":"locales-ca-AD.xml",
		"cs":"locales-cs-CZ.xml",
		"da":"locales-da-DK.xml",
		"de":"locales-de-AT.xml",
		"de":"locales-de-CH.xml",
		"de":"locales-de-DE.xml",
		"el":"locales-el-GR.xml",
		"en":"locales-en-US.xml",
		"es":"locales-es-ES.xml",
		"et":"locales-et-EE.xml",
		"fr":"locales-fr-FR.xml",
		"he":"locales-he-IL.xml",
		"hu":"locales-hu-HU.xml",
		"is":"locales-is-IS.xml",
		"it":"locales-it-IT.xml",
		"ja":"locales-ja-JP.xml",
		"ko":"locales-ko-KR.xml",
		"mn":"locales-mn-MN.xml",
		"nb":"locales-nb-NO.xml",
		"nl":"locales-nl-NL.xml",
		"pl":"locales-pl-PL.xml",
		"pt":"locales-pt-BR.xml",
		"pt":"locales-pt-PT.xml",
		"ro":"locales-ro-RO.xml",
		"ru":"locales-ru-RU.xml",
		"sk":"locales-sk-SK.xml",
		"sl":"locales-sl-SI.xml",
		"sr":"locales-sr-RS.xml",
		"sv":"locales-sv-SE.xml",
		"th":"locales-th-TH.xml",
		"tr":"locales-tr-TR.xml",
		"uk":"locales-uk-UA.xml",
		"vi":"locales-vi-VN.xml",
		"zh":"locales-zh-CN.xml",
		"zh":"locales-zh-TW.xml"
	};
};

RhinoTest.prototype._fixAllNames = function(input){
	for each (obj in input){
		if (!obj.id){
			throw "No id for object in test: "+this.myname;
		}
		for each (key in CSL.CREATORS){
			if (obj[key]){
				for each (var entry in obj[key]){
					var one_char = entry.name.length-1;
					var two_chars = one_char-1;
					entry.sticky = false;
					if ("!!" == entry.name.substr(two_chars)){
						entry.literal = entry.name.substr(0,two_chars).replace(/\s+$/,"");
					} else {
						var parsed = entry.name;
						if ("!" == entry.name.substr(one_char)){
							entry.sticky = true;
							parsed = entry.name.substr(0,one_char).replace(/\s+$/,"");
						}
						parsed = parsed.split(/\s*,\s*/);

						if (parsed.length > 0){
							var m = parsed[0].match(/^\s*([a-z]+)\s+(.*)/);
							if (m){
								entry.prefix = m[1];
								entry["primary-key"] = m[2];
							} else {
								entry["primary-key"] = parsed[0];
							}
						}
						if (parsed.length > 1){
							entry["secondary-key"] = parsed[1];
						}
						if (parsed.length > 2){
							var m = parsed[2].match(/\!\s*(.*)/);
							if (m){
								entry.suffix = m[1];
								entry.comma_suffix = true;
							} else {
								entry.suffix = parsed[2];
							}
						}
					}
				}
			}
		}
	}
};

