CSL = new function () {
	this.START = 0;
	this.END = 1;
	this.SINGLETON = 2;
	this.SUCCESSOR = 3;
	this.SUCCESSOR_OF_SUCCESSOR = 4;
	this.SUPPRESS = 5;
	this.SINGULAR = 0;
	this.PLURAL = 1;
	this.LITERAL = true;
	this.BEFORE = 1;
	this.AFTER = 2;
	this.DESCENDING = 1;
	this.ASCENDING = 2;
	this.FINISH = 1;
	this.POSITION_FIRST = 0;
	this.POSITION_SUBSEQUENT = 1;
	this.POSITION_IBID = 2;
	this.POSITION_IBID_WITH_LOCATOR = 3;
	this.COLLAPSE_VALUES = ["citation-number","year","year-suffix"];
	this.ET_AL_NAMES = ["et-al-min","et-al-use-first"];
	this.ET_AL_NAMES = this.ET_AL_NAMES.concat( ["et-al-subsequent-min","et-al-subsequent-use-first"] );
	this.DISAMBIGUATE_OPTIONS = ["disambiguate-add-names","disambiguate-add-givenname"];
	this.DISAMBIGUATE_OPTIONS.push("disambiguate-add-year-suffix");
	this.PREFIX_PUNCTUATION = /.*[.;:]\s*$/;
	this.SUFFIX_PUNCTUATION = /^\s*[.;:,\(\)].*/;
	this.NUMBER_REGEXP = /(?:^\d+|\d+$|\d{3,})/; // avoid evaluating "F.2d" as numeric
	this.QUOTED_REGEXP = /^".+"$/;
	this.NAME_INITIAL_REGEXP = /^([A-Z\u0400-\u042f])([A-Z\u0400-\u042f])*.*$/;
	var x = new Array();
	x = x.concat(["edition","volume","number-of-volumes","number"]);
	x = x.concat(["issue","title","container-title","issued","page"]);
	x = x.concat(["locator","collection-number","original-date"]);
	x = x.concat(["reporting-date","decision-date","filing-date"]);
	x = x.concat(["revision-date"]);
	this.NUMERIC_VARIABLES = x.slice();
	this.DATE_VARIABLES = ["issued","event","accessed","container","original-date"];
	var x = new Array();
	x = x.concat(["@text-case","@font-family","@font-style","@font-variant"]);
	x = x.concat(["@font-weight","@text-decoration","@vertical-align"]);
	x = x.concat(["@display","@quotes"]);
	this.FORMAT_KEY_SEQUENCE = x.slice();
	this.SUFFIX_CHARS = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z";
	this.ROMAN_NUMERALS = [
		[ "", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix" ],
		[ "", "x", "xx", "xxx", "xl", "l", "lx", "lxx", "lxxx", "xc" ],
		[ "", "c", "cc", "ccc", "cd", "d", "dc", "dcc", "dccc", "cm" ],
		[ "", "m", "mm", "mmm", "mmmm", "mmmmm"]
	];
};
CSL.Core = {};
CSL.Core.Render = {};
CSL.Core.Render.getAmbiguousCite = function(Item,disambig){
	if (disambig){
		this.tmp.disambig_request = disambig;
	} else {
		this.tmp.disambig_request = false;
	}
	this.tmp.area = "citation";
	this.tmp.suppress_decorations = true;
	this.tmp.force_subsequent = true;
	CSL.Core.Render._cite.call(this,Item);
	this.tmp.force_subsequent = false;
	var ret = this.output.string(this,this.output.queue);
	this.tmp.suppress_decorations = false;
	if (false){
		print("ok");
	}
	return ret;
}
CSL.Core.Render.getSortKeys = function(Item,key_type){
	if (false){
		print("KEY TYPE: "+key_type);
	}
	var area = this.tmp.area;
	var strip_prepositions = CSL.Util.Sort.strip_prepositions;
	this.tmp.area = key_type;
	this.tmp.disambig_request = false;
	this.tmp.suppress_decorations = true;
	CSL.Core.Render._cite.call(this,Item);
	this.tmp.suppress_decorations = false;
	for (var i in this[key_type].keys){
		this[key_type].keys[i] = strip_prepositions(this[key_type].keys[i]);
	}
	if (false){
		print("sort keys ("+key_type+"): "+this[key_type].keys);
	}
	this.tmp.area = area;
	return this[key_type].keys;
};
CSL.Core.Render.getAmbigConfig = function(){
	var config = this.tmp.disambig_request;
	if (!config){
		config = this.tmp.disambig_settings;
	}
	var ret = this.fun.clone_ambig_config(config);
	return ret;
};
CSL.Core.Render.getMaxVals = function(){
	return this.tmp.names_max.mystack.slice();
};
CSL.Core.Render.getMinVal = function(){
	return this.tmp["et-al-min"];
};
CSL.Core.Render.getSpliceDelimiter = function(){
	return this.tmp.splice_delimiter;
};
CSL.Core.Render.getModes = function(){
	var ret = new Array();
	if (this[this.tmp.area].opt["disambiguate-add-names"]){
		ret.push("names");
	}
	if (this[this.tmp.area].opt["disambiguate-add-givenname"]){
		ret.push("givens");
	}
	return ret;
};
CSL.Core.Render._bibliography_entries = function (){
	this.tmp.area = "bibliography";
	var input = this.fun.retriever.getInput(this.registry.getSortedIds());
	this.tmp.disambig_override = true;
	this.output.addToken("bibliography","\n");
	this.output.openLevel("bibliography");
	for each (item in input){
		if (false){
			print("BIB: "+item.id);
		}
		CSL.Core.Render._cite.call(this,item);
		//this.output.squeeze();
	}
	this.output.closeLevel();
	this.tmp.disambig_override = false;
	return this.output.string(this,this.output.queue);
};
CSL.Core.Render.registerItemKeys = function() {
};
CSL.Core.Render._unit_of_reference = function (inputList){
	this.tmp.area = "citation";
	var delimiter = "";
	var result = "";
	var objects = [];
	for each (var Item in inputList){
		CSL.Core.Render._cite.call(this,Item);
		//
		// This will produce a stack with one
		// layer, and exactly one or two items.
		// We merge these as we go along, to get
		// the joins right for the pairs.
		delimiter = this.getSpliceDelimiter();
		this.tmp.delimiter.replace(delimiter);
		this.tmp.handle_ranges = true;
		var composite = this.output.string(this,this.output.queue);
		this.tmp.handle_ranges = false;
		//
		// At last!  Ready to compose trailing blobs.
		// We convert "string" output object to an array
		// before collapsing blobs.
		if (composite["str"]){
			if (objects.length){
				objects.push(this.tmp.splice_delimiter);
			}
			objects.push(composite["str"]);
		}
		if (composite["obj"].length){
			if (objects.length && !composite["str"]){
				for each (var obj in composite["obj"]){
					obj.splice_prefix = this.tmp.splice_delimiter;
					if (this[this.tmp.area].opt["year-suffix-delimiter"]){
						obj.successor_prefix = this[this.tmp.area].opt["year-suffix-delimiter"];
					} else {
						obj.successor_prefix = this.tmp.splice_delimiter;
					}
				}
			}
			objects = objects.concat(composite["obj"]);
		}
	}
	result += this.output.renderBlobs(objects);
	result = this.citation.opt.layout_prefix + result + this.citation.opt.layout_suffix;
	if (!this.tmp.suppress_decorations){
		for each (var params in this.citation.opt.layout_decorations){
			result = this.fun.decorate[params[0]][params[1]](result);
		}
	}
	return result;
};
CSL.Core.Render._cite = function(Item){
	for each (var func in this.init){
		func(this,Item);
	}
	var next = 0;
	while(next < this[this.tmp.area].tokens.length){
		next = CSL.Core.Render._render.call(this[this.tmp.area].tokens[next],this,Item);
    }
	for each (func in this.stop){
		func(this,Item);
	}
};
CSL.Core.Render._render = function(state,Item){
    var next = this.next;
	var maybenext = false;
	if (false){
		print("---> Token: "+this.name+" ("+state.tmp.area+")");
		print("       next is: "+next+", success is: "+this.succeed+", fail is: "+this.fail);
	}
	if (this.evaluator){
	    next = this.evaluator.call(this,state,Item);
    };
	for each (var exec in this.execs){
	    maybenext = exec.call(this,state,Item);
		if (maybenext){
			next = maybenext;
		};
	};
	if (false){
		print("---> done");
	}
	return next;
};
CSL.Core.Build = function(stylexml,xmlLingo) {
	this._builder = _builder;
    this.showXml = showXml; // for testing
	this._getNavi = _getNavi; // exposed for testing
	if (!xmlLingo){
	    //xmlLingo = "JunkyardJavascript";
	    xmlLingo = "E4X";
	}
	var xmlParser = CSL.System.Xml[xmlLingo];
	var xml = xmlParser.parse(stylexml);
	var xmlCommandInterface = CSL.System.Xml[xmlLingo].commandInterface;
	var state = new CSL.Factory.State(xmlCommandInterface,xml);
	this.state = state;
	function _builder(state){
		this._build = _build; // exposed for testing
		this.navi = navi; // exposed for testing
		this.getObject = getObject;
		var nodelist = state.build.nodeList;
		var navi = new _getNavi(state);
		function _build(){ // used to accept nodelist as arg
			if (navi.getkids()){
				_build(navi.getXml());
			} else {
				if (navi.getbro()){
					_build(navi.getXml());
				} else {
					while (state.build.nodeList.length > 1) {
						if (navi.remember()){
							_build(navi.getXml());
						}
					}
				}
			}
			return state;
		}
		function getObject(){
			// These startup loops are too complex
			var state = this._build(); // used to have nodelist as arg
			return state;
		}
	};
	function _getNavi(state){
		this.getkids = getkids;
		this.getbro = getbro;
		this.remember = remember;
		this.getXml = getXml;
		var depth = 0;
		this.depth = depth;
		function remember(){
			depth += -1;
			state.build.nodeList.pop();
			// closing node, process result of children
			var node = state.build.nodeList[depth][1][(state.build.nodeList[depth][0])];
			CSL.Factory.XmlToToken.call(node,state,CSL.END);
			return getbro();
		}
		function getbro(){
			var sneakpeek = state.build.nodeList[depth][1][(state.build.nodeList[depth][0]+1)];
			if (sneakpeek){
				state.build.nodeList[depth][0] += 1;
				return true;
			} else {
				return false;
			}
		}
		function getkids (){
			var currnode = state.build.nodeList[depth][1][state.build.nodeList[depth][0]];
			var sneakpeek = state.build.xmlCommandInterface.children.call(currnode);
			if (state.build.xmlCommandInterface.numberofnodes.call(sneakpeek) == 0){
				// singleton, process immediately
				CSL.Factory.XmlToToken.call(currnode,state,CSL.SINGLETON);
				return false;
			} else {
				// if first node of a span, process it, then descend
				CSL.Factory.XmlToToken.call(currnode,state,CSL.START);
				depth += 1;
				state.build.nodeList.push([0,sneakpeek]);
				return true;
			}
		}
		function getXml(){
			return state.build.nodeList[depth][1];
		}
	}
	function showXml(){
		return xml;
	}
};
CSL.Core.Build.prototype.build = function(locale){
	this.state.opt.locale = locale;
	var engine = new this._builder(this.state);
	var ret = engine.getObject();
	ret.registry = new CSL.Factory.Registry(ret);
	return ret;
};
CSL.Core.Configure = function(state,mode) {
	this.state = state;
	if (!mode){
	    mode = "html";
	}
	if (this.state.build){
		delete this.state.build;
	}
	this.state.fun.decorate = CSL.Factory.Mode(mode);
	this.state.opt.mode = mode;
};
CSL.Core.Configure.prototype.configure = function(){
	for each (var area in ["citation", "citation_sort", "bibliography","bibliography_sort"]){
		for (var pos=(this.state[area].tokens.length-1); pos>-1; pos--){
			var token = this.state[area].tokens[pos];
			token["next"] = (pos+1);
			if (token.name && CSL.Lib.Elements[token.name].configure){
				CSL.Lib.Elements[token.name].configure.call(token,this.state,pos);
			}
		}
	}
	this.state["version"] = CSL.Factory.version;
	return this.state;
};
CSL.Util = {};
CSL.Util.Dates = new function(){};
CSL.Util.Dates.year = new function(){};
CSL.Util.Dates.year["long"] = function(state,num){
	return num.toString();
}
CSL.Util.Dates.year["short"] = function(state,num){
	num = num.toString();
	if (num && num.length == 4){
		return num.substr(2);
	}
}
CSL.Util.Dates["month"] = new function(){};
CSL.Util.Dates.month["numeric"] = function(state,num){
	return num.toString();
}
CSL.Util.Dates.month["numeric-leading-zeros"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	return num.toString();
}
CSL.Util.Dates.month["long"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	num = "month-"+num;
	return state.opt.term[num]["long"][0];
}
CSL.Util.Dates.month["short"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	num = "month-"+num;
	return state.opt.term[num]["short"][0];
}
CSL.Util.Dates["day"] = new function(){};
CSL.Util.Dates.day["numeric"] = function(state,num){
	return num.toString();
}
CSL.Util.Dates.day["numeric-leading-zeros"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	return num.toString();
}
CSL.Util.Dates.day["ordinal"] = function(state,num){
	var suffixes = ["st","nd","rd","th"];
	var str = num.toString();
	if ( (num/10)%10 == 1){
		str += suffixes[3];
	} else if ( num%10 == 1) {
		str += suffixes[0];
	} else if ( num%10 == 2){
		str += suffixes[1];
	} else if ( num%10 == 3){
		str += suffixes[2];
	} else {
		str += suffixes[3];
	}
	return str;
}
//
// This will probably become CSL.Util.Numbers
//
CSL.Util.Disambiguate = new function(){};
CSL.Util.Disambiguate.Romanizer = function (){};
CSL.Util.Disambiguate.Romanizer.prototype.format = function(num){
	var ret = "";
	if (num < 6000) {
		var numstr = num.toString().split("");
		numstr.reverse();
		var pos = 0;
		var n = 0;
		for (var pos in numstr){
			n = parseInt(numstr[pos],10);
			ret = CSL.ROMAN_NUMERALS[pos][n] + ret;
		}
	}
	return ret;
};
CSL.Util.Disambiguate.Suffixator = function(slist){
	if (!slist){
		slist = CSL.SUFFIX_CHARS;
	}
	this.slist = slist.split(",");
};
CSL.Util.Disambiguate.Suffixator.prototype.format = function(num){
	var suffixes = this.get_suffixes(num);
	return suffixes[(suffixes.length-1)];
}
CSL.Util.Disambiguate.Suffixator.prototype.get_suffixes = function(num){
	var suffixes = new Array();
	for (var i=0; i <= num; i++){
		if (!i){
			suffixes.push([0]);
		} else {
			suffixes.push( this.incrementArray(suffixes[(suffixes.length-1)],this.slist) );
		}
	};
	for (pos in suffixes){
		var digits = suffixes[pos];
		var chrs = "";
		for each (digit in digits){
			chrs = chrs+this.slist[digit];
		}
		suffixes[pos] = chrs;
	};
	return suffixes;
};
CSL.Util.Disambiguate.Suffixator.prototype.incrementArray = function (array){
	array = array.slice();
	var incremented = false;
	for (var i=(array.length-1); i > -1; i--){
		if (array[i] < (this.slist.length-1)){
			array[i] += 1;
			if (i < (array.length-1)){
				array[(i+1)] = 0;
			}
			incremented = true;
			break;
		}
	}
	if (!incremented){
		for (var i in array){
			array[i] = 0;
		}
		var newdigit = [0];
		array = newdigit.concat(array);
	}
	return array;
};
CSL.Util.Names = new function(){};
CSL.Util.Names.outputNames = function(state,display_names){
	var segments = new this.StartMiddleEnd(state,display_names);
	var sort_order = state.output.getToken("name").strings["name-as-sort-order"];
	if (sort_order == "first"){
		state.output.addToken("start");
		state.output.getToken("start").strings.name_as_sort_order = true;
	} else if (sort_order == "all"){
		state.output.addToken("start");
		state.output.getToken("start").strings.name_as_sort_order = true;
		state.output.addToken("middle");
		state.output.getToken("middle").strings.name_as_sort_order = true;
		state.output.addToken("end");
		state.output.getToken("end").strings.name_as_sort_order = true;
	}
	state.output.openLevel("name");
	state.output.openLevel("inner");
	segments.outputSegmentNames("start");
	segments.outputSegmentNames("middle");
	state.output.closeLevel();
	segments.outputSegmentNames("end");
	state.output.closeLevel();
};
CSL.Util.Names.StartMiddleEnd = function(state,names){
	this.state = state;
	this.nameoffset = 0;
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
			//
			// XXXXX Separate formatting for institution names?
			// XXXXX This needs to be firmly settled in xbib.
			//
			state.output.append(this.name.literal);
		} else {
			var sequence = CSL.Util.Names.getNamepartSequence(this.name,state.output.getToken(seg));
			state.output.openLevel(sequence[0][0]);
			state.output.openLevel(sequence[0][1]);
			state.output.openLevel(sequence[0][2]);
			this.outputNameParts(sequence[1]);
			state.output.closeLevel();
			state.output.openLevel(sequence[0][2]);
			// XXX cloned code!  make this a function.
			this.outputNameParts(sequence[2]);
			state.output.closeLevel();
			state.output.closeLevel();
			//
			// articular goes here  //
			//
			this.outputNameParts(sequence[3]);
			state.output.closeLevel();
			//
			// the articular goes in at a different level, but
			// is nonetheless part of the name, so it goes into
			// this function to avoid repetition.
			// (special handling when comma is to be included)
			//if (name.suffix){
			//	state.output.squeeze();
			//	if (name.comma_suffix){
			//		state.tmp.delimiter.replace(", ");
			//	}
			//	state.output.append(name.suffix);
			//}
		}
	};
	this.nameoffset += this.segments[seg].length;
}
CSL.Util.Names.StartMiddleEnd.prototype.outputNameParts = function(subsequence){
	var state = this.state;
	for each (var key in subsequence){
		var namepart = this.name[key];
		if ("secondary-key" == key && !this.name.sticky){
			if (0 == state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][(this.namenum+this.nameoffset)]){
				continue;
			} else if (1 == state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][(this.namenum+this.nameoffset)]){
				namepart = state.fun.initialize_with(namepart,state.tmp["initialize-with"]);
			}
		}
		//state.output.openLevel(key);
		state.output.append(namepart,key);
		//state.output.closeLevel();
	}
}
CSL.Util.Names.getNamepartSequence = function(name,token){
	if (name.comma_suffix){
		var suffix_sep = "commasep";
	} else {
		var suffix_sep = "space";
	}
	var romanesque = name["primary-key"].match(/.*[a-zA-Z\u0400-\u052f].*/);
	if (!romanesque ){ // neither roman nor Cyrillic characters
		var sequence = [["empty","empty","empty"],["prefix", "primary-key"],["secondary-key"],[]];
	} else if (name.sticky) { // entry likes sort order
		var sequence = [["space","space","space"],["prefix", "primary-key"],["secondary-key"],[]];
	} else if (token && token.strings.name_as_sort_order){
		var sequence = [["sortsep","sortsep","space"],["prefix", "primary-key"],["secondary-key"],["suffix"]];
	} else { // plain vanilla
		var sequence = [[suffix_sep,"space","space"],["secondary-key"],["prefix","primary-key"],["suffix"]];
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
//
// XXXX A handy guide to variable assignments that need
// XXXX to be eliminated.  :)
//
CSL.Util.Names.reinit = function(state,Item){
	for each (namevar in state.tmp.value){
		state.tmp.name_quash[namevar.type] = true;
	}
	state.tmp.value = new Array();
	state.tmp.names_substituting = false;
	state.tmp.name_et_al_term = false;
	state.tmp.name_et_al_decorations = false;
	state.tmp.name_et_al_form = "long";
	state.tmp["et-al-min"] = false;
	state.tmp["et-al-use-first"] = false;
	state.tmp["initialize-with"] = false;
	state.tmp["name-as-sort-order"] = false;
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
	var name;
	for each (nameset in namesets.slice(1)){
		if (base_nameset.length != nameset.length){
			return false;
		}
		if (varnames.indexOf(nameset.type) == -1){
			varnames.push(nameset.type);
		}
		for (var n in nameset.names){
			name = nameset.names[n];
			for each (var part in ["primary-key","secondary-key","prefix","suffix"]){
				if (base_nameset.names[n][part] != name[part]){
					return false;
				}
			}
		}
	}
	varnames.sort();
	return state.opt.term[varnames.join("")];
};
CSL.Util.Names.initialize_with = function(name,terminator){
	var namelist = name.split(/\s+/);
	var nstring = "";
	for each (var n in namelist){
		var m = n.match( CSL.NAME_INITIAL_REGEXP);
		if (m){
			var extra = "";
			if (m[2]){
				extra = m[2].toLocaleLowerCase();
			}
			nstring = nstring + m[1].toLocaleUpperCase() + extra + terminator;
		};
	};
	if (nstring){
		return nstring;
	}
	return name;
};
CSL.Util.Sort = new function(){};
CSL.Util.Sort.strip_prepositions = function(str){
	var m = str.toLocaleLowerCase().match(/((a|an|the)\s+)/);
	if (m){
		str = str.substr(m[1].length);
	};
	return str;
};
CSL.Util.FlipFlopper = function(){
	this.flipflops = [];
	this.objlist = [];
	this.cont = true;
	this.stoplist = [];
};
CSL.Util.FlipFlopper.prototype.register = function(start, end, func, alt){
	var flipflop = {
		"start": start,
		"end": end,
		"func": func,
		"alt": alt
	};
	this.flipflops.push(flipflop);
};
CSL.Util.FlipFlopper.prototype.compose = function(blob){
	if (this.flipflops.length){
		this.stoplist = [];
		blob = this._compose(blob);
	}
	return blob;
}
CSL.Util.FlipFlopper.prototype._compose = function(blob){
	if (this.find(blob.blobs)){
		var str = blob.blobs;
		var flipflop = this.flipflops[this.fpos];
		var strlst = this.split(this.fpos, blob.blobs);
		if (strlst.length > 1){
			blob.blobs = new Array();
			//
			// Cast split items as unformatted objects for
			// a start.
			for (var j=0; j < strlst.length; j++){
				var tok = new CSL.Factory.Token();
				var newblob = new CSL.Factory.Blob(tok,strlst[j]);
				blob.push(newblob);
			}
			//
			// Apply registered formatting decorations to
			// every other element of the split, starting
			// with the second.
			//
			for (var j=1; j < blob.blobs.length; j += 2){
				this.applyFlipFlop(blob.blobs[j],flipflop,blob);
			}
			//
			// Install the bloblist and iterate over it
			//
			//blob.blobs = bloblist;
			for (var i in blob.blobs){
				blob.blobs[i] = this.compose(blob.blobs[i]);
			}
		} else {
			blob.blobs = strlst;
		}
	} // if find flipflop string inside blob
	return blob;
}
CSL.Util.FlipFlopper.prototype.find = function(str){
	this.fpos = -1;
	var min = [-1, -1];
	var values = [];
	var val = [];
	for (var i in this.flipflops){
		if (i in this.stoplist){
			continue;
		}
		val = [ i, str.indexOf(this.flipflops[i]["start"]) ];
		values.push(val.slice());
	}
	for each (var val in values){
		if (val[1] > min[1]){
			min = val;
		};
	}
	for each (var val in values){
		if (val[1] > -1 && val[1] < min[1]){
			min = val;
		}
	}
	this.fpos = min[0];
	if (this.fpos > -1){
		return true;
	}
	return false;
}
CSL.Util.FlipFlopper.prototype.applyFlipFlop = function(blob,flipflop){
	var found = false;
	var thing_to_add = flipflop.func;
	var breakme = false;
	for each (var blobdecorations in blob.alldecor){
		for (var i in blobdecorations){
			var decor = blobdecorations[i];
			var func_match = decor[0] == flipflop.func[0] && decor[1] == flipflop.func[1];
			var alt_match = decor[0] == flipflop.alt[0] && decor[1] == flipflop.alt[1];
			if (flipflop.alt && func_match){
				// replace with alt, mark as done
				thing_to_add = flipflop.alt;
				breakme = true;
				break;
			}
		}
		if (breakme){
			break;
		}
	}
	blob.decorations.reverse();
	blob.decorations.push( thing_to_add );
	blob.decorations.reverse();
};
CSL.Util.FlipFlopper.prototype.split = function(idx,str){
	var spec = this.flipflops[idx];
	var lst1 = str.split(spec["start"]);
	for (var i=(lst1.length-1); i > 0; i--){
		var first = lst1[(i-1)];
		var second = lst1[i];
		if ("\\" == first[(first.length-1)]){
			lst1[(i-1)] = first.slice(0,(first.length-1));
			var start = lst1.slice(0,i);
			start[(start.length-1)] += spec["start"];
			start[(start.length-1)] += lst1[i];
			var end = lst1.slice((i+1));
			lst1 = start.concat(end);
		}
	}
	if (lst1.length > 1){
		if (spec["start"] != spec["end"]){
			for (var i=(lst1.length-1); i > 0; i--){
				var sublst = lst1[i].split(spec["end"]);
				// reduce to a two-element list
				for (var j=(sublst.length-1); j > 1; j--){
					sublst[(j-1)] += spec["end"];
					sublst[(j-1)] += sublst[j];
					sublst.pop();
				}
				var start = lst1.slice(0,i);
				var end = lst1.slice((i+1));
				if (sublst.length == 1){
					start[(start.length-1)] += spec["start"];
					start[(start.length-1)] += sublst[0];
					lst1 = start.concat(end);
				} else {
					lst1 = start.concat(sublst).concat(end);
				}
			}
		} else {
			if (lst1.length && (lst1.length % 2) == 0){
				var buf = lst1.pop();
				lst1[(lst1.length-1)] += spec["start"];
				lst1[(lst1.length-1)] += buf;
			}
		}
	}
	return lst1;
}
CSL.Factory = {};
CSL.Factory.version = function(){
	var msg = "\"Entropy\" citation processor (a.k.a. citeproc-js) ver.0.01";
	print(msg);
	return msg;
};
CSL.Factory.XmlToToken = function(state,tokentype){
	var name = state.build.xmlCommandInterface.nodename.call(this);
	if (state.build.skip && state.build.skip != name){
		return;
	}
	if (!name){
		var txt = state.build.xmlCommandInterface.content.call(this);
		if (txt){
			state.build.text = txt;
		}
		return;
	}
	if ( ! CSL.Lib.Elements[state.build.xmlCommandInterface.nodename.call(this)]){
		throw "Undefined node name \""+name+"\".";
	}
	var attrfuncs = new Array();
	var attributes = state.build.xmlCommandInterface.attributes.call(this);
	var decorations = CSL.Factory.setDecorations.call(this,state,attributes);
	var token = new CSL.Factory.Token(name,tokentype);
	for (var key in attributes){
		try {
			var attrfunc = CSL.Lib.Attributes[key].call(token,state,attributes[key]);
		} catch (e) {
			if (e == "TypeError: Cannot call method \"call\" of undefined"){
				throw "Unknown attribute \""+key+"\" in node \""+name+"\" while processing CSL file";
			} else {
				throw "CSL processor error, "+key+" attribute: "+e;
			}
		}
		if (attrfunc){
			attrfuncs.push(attrfunc);
		}
	}
	token.decorations = decorations;
	if (state.build.children.length){
		var target = state.build.children[0];
	} else {
		var target = state[state.build.area].tokens;
	}
	CSL.Lib.Elements[name].build.call(token,state,target);
};
CSL.Factory.mark_output = function(state,content){
	if (content){
		state.tmp.term_sibling.replace( true );
	} else {
		if (undefined == state.tmp.term_sibling.value()) {
			state.tmp.term_sibling.replace( false, CSL.LITERAL );
		}
	}
}
CSL.Factory.setDecorations = function(state,attributes){
	var ret = new Array();
	for each (var key in CSL.FORMAT_KEY_SEQUENCE){
		if (attributes[key]){
			ret.push([key,attributes[key]]);
			delete attributes[key];
		}
	}
	return ret;
};
CSL.Factory.renderDecorations = function(state){
	var ret = new Array();
	for each (hint in this.decorations){
		ret.push(state.fun.decorate[hint[0]][hint[1]]);
	}
	this.decorations = ret;
};
CSL.Factory.substituteOne = function(template) {
	return function(list) {
		if ("string" == typeof list){
			return template.replace("%%STRING%%",list);
		}
		var decor = template.split("%%STRING%%");
		var ret = [{"is_delimiter":true,"value":decor[0]}].concat(list);
		ret.push({"is_delimiter":true,"value":decor[1]});
		return ret;
	};
};
CSL.Factory.substituteTwo = function(template) {
	return function(param) {
		var template2 = template.replace("%%PARAM%%", param);
		return function(list) {
			if ("string" == typeof list){
				return template2.replace("%%STRING%%",list);
			}
			var decor = template2.split("%%STRING");
			var ret = [{"is_delimiter":true,"value":decor[0]}].concat(list);
			ret.push({"is_delimiter":true,"value":decor[1]});
			return ret;
		};
	};
};
CSL.Factory.Mode = function(mode){
	var decorations = new Object();
	var params = CSL.Output.Formats[mode];
	for (var param in params) {
		var func = false;
		var val = params[param];
		var args = param.split('/');
		if (typeof val == "string" && val.indexOf("%%STRING%%") > -1)  {
			if (val.indexOf("%%PARAM%%") > -1) {
				func = CSL.Factory.substituteTwo(val);
			} else {
				func = CSL.Factory.substituteOne(val);
			}
		} else if (typeof val == "boolean" && !val) {
			func = CSL.Output.Formatters.passthrough;
		} else if (typeof val == "function") {
			func = val;
		} else {
			throw "CSL.Compiler: Bad "+mode+" config entry for "+param+": "+val;
		}
		if (args.length == 1) {
			decorations[args[0]] = func;
		} else if (args.length == 2) {
			if (!decorations[args[0]]) {
				decorations[args[0]] = new Object();
			}
			decorations[args[0]][args[1]] = func;
		}
	}
	return decorations;
};
CSL.Factory.expandMacro = function(macro_key_token){
	var mkey = macro_key_token.postponed_macro;
	if (this.build.macro_stack.indexOf(mkey) > -1){
		throw "CSL processor error: call to macro \""+mkey+"\" would cause an infinite loop";
	} else {
		this.build.macro_stack.push(mkey);
	}
	var ret = new Array();
	var start_token = new CSL.Factory.Token("group",CSL.START);
	ret.push(start_token);
	for (var i in this.build.macro[mkey]){
		//
		// could use for each; this was an attempt to get a
		// fresh copy of the token to defeat a loop involving
		// interaction between sort and citation render.  had
		// no effect, probably not needed.
		var token = this.build.macro[mkey][i];
		if (token.postponed_macro){
			//
			// nested expansion
			ret.concat(CSL.Factory.expandMacro.call(this,token));
		} else {
			//
			// clone the token, so that navigation pointers are
			// specific to the token list into which the macro
			//  is being expanded.
			var newtoken = new Object();
			for (i in token) {
				newtoken[i] = token[i];
			}
			ret.push(newtoken);
		}
	}
	var end_token = new CSL.Factory.Token("group",CSL.END);
	ret.push(end_token);
	this.build.macro_stack.pop();
	return ret;
};
CSL.Factory.cloneAmbigConfig = function(config){
	var ret = new Object();
	ret["names"] = new Array();
	ret["givens"] = new Array();
	ret["year_suffix"] = false;
	ret["disambiguate"] = false;
	for (var i in config["names"]){
		var param = config["names"][i];
		ret["names"][i] = param;
	}
	for (var i in config["givens"]){
		var param = new Array();
		for (var j in config["givens"][i]){
			param.push(config["givens"][i][j]);
		}
		ret["givens"].push(param);
	}
	ret["year_suffix"] = config["year_suffix"];
	ret["disambiguate"] = config["disambiguate"];
	return ret;
};
CSL.Factory.State = function (xmlCommandInterface,nodelist){
	this.init = new Array();
	this.stop = new Array();
	this.opt = new Object();
	this.tmp = new Object();
	this.fun = new Object();
	this.fun.retriever = new CSL.System.Retrieval.GetInput();
	this.build = new Object();
	this.build["alternate-term"] = false;
	this.configure = new Object();
	this.citation = new Object();
	this.citation.opt = new Object();
	this.citation.tokens = new Array();
	this.bibliography = new Object();
	this.bibliography.opt = new Object();
	this.bibliography.tokens = new Array();
	this.citation.opt["et-al-min"] = 0;
	this.citation.opt["et-al-use-first"] = 1;
	this.citation.opt["et-al-subsequent-min"] = false;
	this.citation.opt["et-al-subsequent-use-first"] = false;
	this.bibliography.opt["et-al-min"] = 0;
	this.bibliography.opt["et-al-use-first"] = 1;
	this.bibliography.opt["et-al-subsequent-min"] = 0;
	this.bibliography.opt["et-al-subsequent-use-first"] = 1;
	this.bibliography_sort = new Object();
	this.citation_sort = new Object();
	this.bibliography_sort.tokens = new Array();
	this.bibliography_sort.opt = new Object();
	this.bibliography_sort.opt.sort_directions = new Array();
	this.bibliography_sort.keys = new Array();
	this.citation_sort.tokens = new Array();
	this.citation_sort.opt = new Object();
	this.citation_sort.opt.sort_directions = new Array();
	this.citation_sort.keys = new Array();
	this.opt.lang = false;
	this.opt.term = new Object();
	this.citation.opt.collapse = new Array();
	this.bibliography.opt.collapse = new Array();
	this.citation.opt["disambiguate-add-names"] = false;
	this.citation.opt["disambiguate-add-givenname"] = false;
	this.bibliography.opt["disambiguate-add-names"] = false;
	this.bibliography.opt["disambiguate-add-givenname"] = false;
	this.tmp.names_max = new CSL.Factory.Stack();
	this.tmp.names_base = new CSL.Factory.Stack();
	this.tmp.givens_base = new CSL.Factory.Stack();
	this.build.in_bibliography = false;
	this.tmp.disambig_request = false;
	this.tmp["name-as-sort-order"] = false;
	this.tmp.suppress_decorations = false;
	this.tmp.disambig_settings = new CSL.Factory.AmbigConfig();
	this.tmp.bib_sort_keys = new Array();
	this.tmp.prefix = new CSL.Factory.Stack("",CSL.LITERAL);
	this.tmp.suffix = new CSL.Factory.Stack("",CSL.LITERAL);
	this.tmp.delimiter = new CSL.Factory.Stack("",CSL.LITERAL);
	this.fun.names_reinit = CSL.Util.Names.reinit;
	this.fun.initialize_with = CSL.Util.Names.initialize_with;
	this.fun.clone_ambig_config = CSL.Factory.cloneAmbigConfig;
	this.tmp.initialize_with = new CSL.Factory.Stack();
	this.fun.get_common_term = CSL.Util.Names.getCommonTerm;
	this.fun.suffixator = new CSL.Util.Disambiguate.Suffixator(CSL.SUFFIX_CHARS);
	this.fun.romanizer = new CSL.Util.Disambiguate.Romanizer();
	this.fun.flipflopper = new CSL.Util.FlipFlopper();
	this.tmp.tokenstore_stack = new CSL.Factory.Stack();
	this.tmp.name_quash = new Object();
	this.tmp.last_suffix_used = "";
	this.tmp.last_names_used = new Array();
	this.tmp.last_years_used = new Array();
	this.tmp.years_used = new Array();
	this.tmp.names_used = new Array();
	this.splice_delimiter = false;
	this.tmp.names_substituting = false;
	this.tmp.nameset_counter = 0;
	this.fun.mark_output = CSL.Factory.mark_output;
	this.tmp.term_sibling = new CSL.Factory.Stack( undefined, CSL.LITERAL);
	this.tmp.term_predecessor = false;
	this.tmp.jump = new CSL.Factory.Stack(0,CSL.LITERAL);
	this.tmp.decorations = new CSL.Factory.Stack();
	this.fun.decorate = false;
	this.tmp.area = "citation";
	this.build.area = "citation";
	this.tmp.value = new Array();
	this.tmp.namepart_decorations = new Object();
	this.tmp.namepart_type = false;
	this.output = new CSL.Output.Queue(this);
	this.configure.fail = new Array();
	this.configure.succeed = new Array();
	this.build.xmlCommandInterface = xmlCommandInterface;
	this.build.text = false;
	this.build.lang = false;
	this.opt["class"] = false;
	this.build.in_style = false;
	this.build.skip = false;
	this.build.postponed_macro = false;
	this.build.layout_flag = false;
	this.build.children = new Array();
	this.build.name = false;
	this.build.form = false;
	this.build.term = false;
	this.build.macro = new Object();
	this.build.macro_stack = new Array();
	this.build.nodeList = new Array();
	this.build.nodeList.push([0, nodelist]);
};
CSL.Factory.State.prototype.getAmbiguousCite = CSL.Core.Render.getAmbiguousCite;
CSL.Factory.State.prototype.getSortKeys = CSL.Core.Render.getSortKeys;
CSL.Factory.State.prototype.getAmbigConfig = CSL.Core.Render.getAmbigConfig;
CSL.Factory.State.prototype.getMaxVals = CSL.Core.Render.getMaxVals;
CSL.Factory.State.prototype.getMinVal = CSL.Core.Render.getMinVal;
CSL.Factory.State.prototype.getModes = CSL.Core.Render.getModes;
CSL.Factory.State.prototype.getSpliceDelimiter = CSL.Core.Render.getSpliceDelimiter;
CSL.makeStyle = function(xml,locale){
	var builder = new CSL.Core.Build(xml);
	var raw = builder.build(locale);
	var conf = new CSL.Core.Configure(raw);
	var ret = conf.configure();
	return ret;
}
CSL.Factory.State.prototype.registerFlipFlops = function(flist){
	for each (ff in flist){
		this.fun.flipflopper.register(ff["start"], ff["end"], ff["func"], ff["alt"]);
	}
	return true;
}
CSL.Factory.State.prototype.makeCitationCluster = function(inputList){
	this.insertItems(inputList);
	if (inputList && inputList.length > 1 && this["citation_sort"].tokens.length > 0){
		var newlist = new Array();
		var keys_list = new Array();
		for each (var Item in inputList){
			var keys = this.getSortKeys(Item,"citation_sort");
			keys["cheaters_hack"] = Item;
			keys_list.push(keys);
		}
		var srt = new CSL.Factory.Registry.Comparifier(this,"citation_sort");
		keys_list.sort(srt.compareKeys);
		for each (key in keys_list){
			newlist.push(key.cheaters_hack);
		}
		//
		// XXXXX this is all one-time, one-way, slice probably isn't needed here?
		inputList = newlist;
	}
	this.tmp.last_suffix_used = "";
	this.tmp.last_names_used = new Array();
	this.tmp.last_years_used = new Array();
	var str = CSL.Core.Render._unit_of_reference.call(this,inputList);
	return str;
};
CSL.Factory.State.prototype.makeBibliography = function(){
	var debug = false;
	if (debug){
		for each (tok in this.bibliography.tokens){
			print("bibtok: "+tok.name);
		}
		print("---");
		for each (tok in this.citation.tokens){
			print("cittok: "+tok.name);
		}
		print("---");
		for each (tok in this.bibliography_sort.tokens){
			print("bibsorttok: "+tok.name);
		}
	}
	return CSL.Core.Render._bibliography_entries.call(this);
};
CSL.Factory.State.prototype.insertItems = function(inputList){
	for each (item in inputList){
		this.fun.retriever.input[item.id] = item;
		this.registry.insert(this,item);
	};
};
CSL.Factory.Blob = function(token,str){
	if (token){
		this.strings = new Object();
		for (key in token.strings){
			this.strings[key] = token.strings[key];
		};
		this.decorations = new Array();
		for each (keyset in token.decorations){
			this.decorations.push(keyset.slice());
		}
		//this.decorations = token.decorations;
	} else {
		this.strings = new Object();
		this.decorations = new Array();
	};
	if ("string" == typeof str){
		this.blobs = str;
	} else {
		this.blobs = new Array();
	};
	this.alldecor = [ this.decorations ];
};
CSL.Factory.Blob.prototype.push = function(blob){
	if ("string" == typeof this.blobs){
		throw "Attempt to push blob onto string object";
	} else {
		blob.alldecor = blob.alldecor.concat(this.alldecor);
		this.blobs.push(blob);
	}
};
CSL.Factory.Token = function(name,tokentype){
	this.name = name;
	this.strings = new Object();
	this.strings["delimiter"] = "";
	this.strings["prefix"] = "";
	this.strings["suffix"] = "";
	this.decorations = false;
	this.variables = [];
	this.execs = new Array();
	this.tokentype = tokentype;
	this.evaluator = false;
	this.tests = new Array();
	this.succeed = false;
	this.fail = false;
	this.next = false;
};
CSL.Factory.Stack = function(val,literal){
	this.mystack = new Array();
	if (literal || val){
		this.mystack.push(val);
	}
};
CSL.Factory.Stack.prototype.clear = function(){
	this.mystack = new Array();
};
CSL.Factory.Stack.prototype.push = function(val,literal){
	if (literal || val){
		this.mystack.push(val);
	} else {
		this.mystack.push("");
	}
};
CSL.Factory.Stack.prototype.replace = function(val,literal){
	if (this.mystack.length == 0){
		throw "Internal CSL processor error: attempt to replace nonexistent stack item";
	}
	if (literal || val){
		this.mystack[(this.mystack.length-1)] = val;
	} else {
		this.mystack[(this.mystack.length-1)] = "";
	}
};
CSL.Factory.Stack.prototype.pop = function(){
	this.mystack.pop();
};
CSL.Factory.Stack.prototype.value = function(){
	return this.mystack[(this.mystack.length-1)];
};
CSL.Factory.Stack.prototype.length = function(){
	return this.mystack.length;
};
CSL.Factory.AmbigConfig = function(){
	this.maxvals = new Array();
	this.minval = 1;
	this.names = new Array();
	this.givens = new Array();
	this.year_suffix = 0;
	this.disambiguate = 0;
};
//
// should allow batched registration of items by
// key.  should behave as an update, with deletion
// of items and the tainting of disambiguation
// partner sets affected by a deletes and additions.
//
//
// we'll need a reset method, to clear the decks
// in the citation area and start over.
CSL.Factory.Registry = function(state){
	this.debug = false;
	this.debug_sort = false;
	if (this.debug){
		print("---> Instantiate registry");
	}
	this.registry = new Object();
	this.ambigs = new Object();
	this.start = false;
	this.end = false;
	this.initialized = false;
	this.skip = false;
	this.maxlength = 0;
	this.sorter = new CSL.Factory.Registry.Comparifier(state,"bibliography_sort");
	this.getSortedIds = function(){
		var step = "next";
		var item_id = this.start;
		var ret = new Array();
		while (true){
			ret.push(item_id);
			item_id = this.registry[item_id][step];
			if ( ! item_id){
				break;
			}
		}
		return ret;
	};
};
CSL.Factory.Registry.prototype.insert = function(state,Item){
	if (this.debug){
		print("---> Start of insert");
	}
	if (this.registry[Item.id]){
		return;
	}
	var sortkeys = state.getSortKeys(Item,"bibliography_sort");
	var akey = state.getAmbiguousCite(Item);
	var abase = state.getAmbigConfig();
	var modes = state.getModes();
	var newitem = {
		"id":Item.id,
		"seq":1,
		"dseq":0,
		"sortkeys":sortkeys,
		"disambig":abase,
		"prev":false,
		"next":false
	};
	if (this.debug){
		print("---> Begin manipulating registry");
	}
	var breakme = false;
	if (!this.initialized){
		if (this.debug_sort){
			print("-->initializing registry with "+newitem.id);
		}
		this.registry[newitem.id] = newitem;
		this.start = newitem.id;
		this.end = newitem.id;
		this.initialized = true;
		//
		// XXXXX
		//this.registerAmbigToken(state,akey,Item.id,abase.slice());
		this.registerAmbigToken(state,akey,Item.id,abase);
		return;
	}
	if (-1 == this.sorter.compareKeys(newitem.sortkeys,this.registry[this.start].sortkeys)){
		if (this.debug_sort){
			print("-->inserting "+newitem.id+" before "+this.start+" as first entry");
		}
		newitem.next = this.registry[this.start].id;
		this.registry[this.start].prev = newitem.id;
		newitem.prev = false;
		newitem.seq = 1;
		var tok = this.registry[this.start];
		this.incrementSubsequentTokens(tok);
		this.start = newitem.id;
		this.registry[newitem.id] = newitem;
		breakme = true;
	}
	if (-1 == this.sorter.compareKeys(this.registry[this.end].sortkeys,newitem.sortkeys)  && !breakme){
		if (this.debug_sort){
			print("-->inserting "+newitem.id+" after "+this.end+" as last entry");
		}
		newitem.prev = this.registry[this.end].id;
		this.registry[this.end].next = newitem.id;
		newitem.next = false;
		newitem.seq = (this.registry[this.end].seq + 1);
		this.end = newitem.id;
		this.registry[newitem.id] = newitem;
		breakme = true;
	}
	var curr = this.registry[this.end];
	while (true && !breakme){
		// compare the new token to be added with
		// the one we're thinking about placing it after.
		var cmp = this.sorter.compareKeys(curr.sortkeys,newitem.sortkeys);
		if (cmp == -1){
			if (this.debug_sort){
				print("-->inserting "+newitem.id+" after "+curr.id);
			}
			// insert mid-list, after the tested item
			this.registry[curr.next].prev = newitem.id;
			newitem.next = curr.next;
			newitem.prev = curr.id;
			curr.next = newitem.id;
			newitem.seq = (curr.seq+1);
			this.incrementSubsequentTokens(this.registry[newitem.next]);
			this.registry[newitem.id] = newitem;
			breakme = true;
			break;
		} else if (cmp == 2){
			breakme = true;
		} else if (cmp == 0) {
			// insert _after_, but this one is equivalent
			// to the comparison partner for sortkey purposes
			// (so we needed to provide for cases where the
			// inserted object ends up at the end of
			// the virtual list.)
			if (false == curr.next){
				if (this.debug_sort){
					print("-->inserting "+newitem.id+" after "+curr.id+" as last entry, although equal");
				}
				newitem.next = false;
				newitem.prev = curr.id;
				curr.next = newitem.id;
				newitem.seq = (curr.seq+1);
				//this.incrementSubsequentTokens(curr);
				this.registry[newitem.id] = newitem;
				this.end = newitem.id;
				breakme = true;
				break;
			} else {
				if (this.debug_sort){
					print("-->inserting "+newitem.id+" after "+curr.id+", although equal");
				}
				this.registry[curr.next].prev = newitem.id;
				newitem.next = curr.next;
				newitem.prev = curr.id;
				curr.next = newitem.id;
				newitem.seq = curr.seq;
				this.registry[newitem.id] = newitem;
				this.incrementSubsequentTokens(newitem);
				breakme = true;
				break;
			}
		}
		if (breakme){
			break;
		}
		//
		// we scan in reverse order, because working
		// from the initial draft of the code, this
		// makes it simpler to order cites in submission
		// order, when no sort keys are available.
		curr = this.registry[curr.prev];
	};
	if (this.debug){
		print("---> End of registry insert");
	}
	this.registerAmbigToken(state,akey,Item.id,abase);
	if (this.ambigs[akey].length > 1){
		if (modes.length){
			if (this.debug){
				print("---> Names disambiguation begin");
			}
			var leftovers = this.disambiguateCites(state,akey,modes);
			if (this.debug){
				print("---> Names disambiguation done");
			}
			//
			// leftovers is a list of registry tokens.  sort them.
			leftovers.sort(this.compareRegistryTokens);
		} else {
			//
			// if we didn't disambiguate with names, everything is
			// a leftover.
			var leftovers = new Array();
			for each (var key in this.ambigs[akey]){
				leftovers.push(this.registry[key]);
				leftovers.sort(this.compareRegistryTokens);
			}
		}
	}
	if (leftovers && leftovers.length && state.opt.has_disambiguate){
		var leftovers = this.disambiguateCites(state,akey,modes,leftovers);
	}
	if ( leftovers && leftovers.length && state[state.tmp.area].opt["disambiguate-add-year-suffix"]){
		//var suffixes = state.fun.suffixator.get_suffixes(leftovers.length);
		for (var i in leftovers){
			this.registry[ leftovers[i].id ].disambig[2] = i;
			this.registry[ leftovers[i].id ].dseq = i;
		}
	}
	if (this.debug) {
		print("---> End of registry cleanup");
	}
};
CSL.Factory.Registry.Comparifier = function(state,keyset){
	var sort_directions = state[keyset].opt.sort_directions.slice();
    this.compareKeys = function(a,b){
		for (var i=0; i < a.length; i++){
			//
			// for ascending sort 1 uses 1, -1 uses -1.
			// For descending sort, the values are reversed.
			var cmp = a[i].toLocaleLowerCase().localeCompare(b[i].toLocaleLowerCase());
			if (0 < cmp){
				return sort_directions[i][1];
			} else if (0 > cmp){
				return sort_directions[i][0];
			}
		}
		return 0;
	};
};
CSL.Factory.Registry.prototype.compareRegistryTokens = function(a,b){
	if (a.seq > b.seq){
		return 1;
	} else if (a.seq < b.seq){
		return -1;
	}
	return 0;
};
CSL.Factory.Registry.prototype.incrementSubsequentTokens = function (tok){
	while (tok.next){
		tok.seq += 1;
		tok = this.registry[tok.next];
	}
	tok.seq += 1;
};
CSL.Factory.Registry.prototype.disambiguateCites = function (state,akey,modes,candidate_list){
	if ( ! candidate_list){
		//
		// We start with the state and an ambig key.
		// We acquire a copy of the list of ambigs that relate to the key from state.
		var ambigs = this.ambigs[akey].slice();
		//
		// We clear the list of ambigs so it can be rebuilt
		this.ambigs[akey] = new Array();
	} else {
		// candidate list consists of registry tokens.
		// extract the ids and build an ambigs list.
		// This is roundabout -- we already collected
		// these once for the first-phase disambiguation.
		// Maybe it can be cleaned up later.
		var ambigs = new Array();
		for each (var reg_token in candidate_list){
			ambigs.push(reg_token.id);
		}
	}
	var id_vals = new Array();
	for each (var a in ambigs){
		id_vals.push(a);
	}
	var tokens = state.fun.retriever.getInput(id_vals);
	var checkerator = new this.Checkerator(tokens,modes);
	checkerator.lastclashes = (ambigs.length-1);
	var base = false;
	checkerator.pos = 0;
	while (checkerator.run()){
		var token = tokens[checkerator.pos];
		if (debug){
			print("<<<<<<<<<<<<<<<<<<<<<<<<< "+ token.id +" >>>>>>>>>>>>>>>>>>>>>>>>>>>");
		}
		//
		// skip items that have been finally resolved.
		if (this.ambigs[akey].indexOf(token.id) > -1){
			if (debug){
				print("---> Skip registered token for: "+token.id);
			}
			checkerator.pos += 1;
			continue;
		}
		checkerator.candidate = token.id;
		if (base == false){
			checkerator.mode = modes[0];
		}
		if (debug){
			print ("  ---> Mode: "+checkerator.mode);
		}
		if (debug){
			print("base in (givens):"+base["givens"]);
		}
		var str = state.getAmbiguousCite(token,base);
		var maxvals = state.getMaxVals();
		var minval = state.getMinVal();
		base = state.getAmbigConfig();
		if (debug){
			print("base out (givens):"+base["givens"]);
		}
		if (candidate_list && candidate_list.length){
			base["disambiguate"] = true;
		}
		checkerator.setBase(base);
		checkerator.setMaxVals(maxvals);
		checkerator.setMinVal(minval);
		for each (testpartner in tokens){
			if (token.id == testpartner.id){
				continue;
			}
			var otherstr = state.getAmbiguousCite(testpartner,base);
			if (debug){
				print("  ---> last clashes: "+checkerator.lastclashes);
				print("  ---> master:    "+token.id);
				print("  ---> master:    "+str);
				print("  ---> partner: "+testpartner.id);
				print("  ---> partner: "+otherstr);
			}
			if(checkerator.checkForClash(str,otherstr)){
				break;
			}
		}
		if (checkerator.evaluateClashes()){
			var base_return = this.decrementNames(state,base);
			this.registerAmbigToken(state,akey,token.id,base_return);
			checkerator.seen.push(token.id);
			if (debug){
				print("  ---> Evaluate: storing token config: "+base);
			}
			continue;
		}
		if (checkerator.maxAmbigLevel()){
			if ( ! state["citation"].opt["disambiguate-add-year-suffix"]){
				//this.registerAmbigToken(state,akey,token.id,base);
				checkerator.mode1_counts = false;
				checkerator.maxed_out_bases[token.id] = base;
				if (debug){
					print("  ---> Max out: remembering token config for: "+token.id);
					print("       ("+base["names"]+":"+base["givens"]+")");
				}
			} else {
				if (debug){
					print("  ---> Max out: NOT storing token config for: "+token.id);
					print("       ("+base["names"]+":"+base["givens"]+")");
				}
			}
			checkerator.seen.push(token.id);
			base = false;
			continue;
		}
		if (debug){
			print("  ---> Incrementing");
		}
		checkerator.incrementAmbigLevel();
	}
	var ret = new Array();
	for each (id in checkerator.ids){
		if (id){
			ret.push(this.registry[id]);
		}
	}
	for (i in checkerator.maxed_out_bases){
		this.registry[i].disambig = checkerator.maxed_out_bases[i];
	}
	return ret;
};
CSL.Factory.Registry.prototype.Checkerator = function(tokens,modes){
	this.seen = new Array();
	this.modes = modes;
	this.mode = this.modes[0];
	this.tokens_length = tokens.length;
	this.pos = 0;
	this.clashes = 0;
	this.maxvals = false;
	this.base = false;
	this.ids = new Array();
	this.maxed_out_bases = new Object();
	for each (token in tokens){
		this.ids.push(token.id);
	}
	this.lastclashes = -1;
	this.namepos = 0;
	this.modepos = 0;
	this.mode1_counts = false;
};
CSL.Factory.Registry.prototype.Checkerator.prototype.run = function(){
	if (this.seen.length < this.tokens_length){
		return true;
	}
	return false;
}
CSL.Factory.Registry.prototype.Checkerator.prototype.setMaxVals = function(maxvals){
	this.maxvals = maxvals;
};
CSL.Factory.Registry.prototype.Checkerator.prototype.setMinVal = function(minval){
	this.minval = minval;
};
CSL.Factory.Registry.prototype.Checkerator.prototype.setBase = function(base){
	this.base = base;
	if (! this.mode1_counts){
		this.mode1_counts = new Array();
		for each (i in this.base["givens"]){
			this.mode1_counts.push(0);
		}
	}
};
CSL.Factory.Registry.prototype.Checkerator.prototype.setMode = function(mode){
	this.mode = mode;
};
CSL.Factory.Registry.prototype.Checkerator.prototype.checkForClash = function(str,otherstr){
	if (str == otherstr){
		if (this.mode == "names"){
			this.clashes += 1;
			if (debug){
				print("   (mode 0 clash, returning true)");
			}
			return true;
		}
		if (this.mode == "givens"){
			this.clashes += 1;
			if (debug){
				print("   (mode 1 clash, returning false)");
			}
		}
		return false;
	}
};
CSL.Factory.Registry.prototype.Checkerator.prototype.evaluateClashes = function(){
	if (!this.maxvals.length){
		return false;
	}
	if (this.mode == "names"){
		if (this.clashes){
			this.lastclashes = this.clashes;
			this.clashes = 0;
			return false;
		} else {
			// cleared, so increment.  also quash the id as done.
			this.ids[this.pos] = false;
			this.pos += 1;
			this.lastclashes = this.clashes;
			return true;
		}
	}
	if (this.mode == "givens"){
		var ret = true;
		if (debug){
			print("  ---> Comparing in mode 1: clashes="+this.clashes+"; lastclashes="+this.lastclashes);
		}
		var namepos = this.mode1_counts[this.modepos];
		if (this.clashes && this.clashes == this.lastclashes){
			if (debug){
				print("   ---> Applying mode 1 defaults: "+this.mode1_defaults);
			}
			if (this.mode1_defaults){
				var old = this.mode1_defaults[(namepos-1)];
				if (debug){
					print("   ---> Resetting to default: ("+old+")");
				}
				this.base["givens"][this.modepos][(namepos-1)] = old;
			}
			ret = false;
		} else if (this.clashes) {
			if (debug){
				print("   ---> Expanding given name helped a little, retaining it");
			}
			ret = false;
		} else { // only non-clash should be possible
			if (debug){
				print("   ---> No clashes, storing token config and going to next");
			}
			this.mode1_counts = false;
			ret = true;
		}
		this.lastclashes = this.clashes;
		this.clashes = 0;
		if (ret){
			this.ids[this.pos] = false;
		}
		return ret;
	}
};
CSL.Factory.Registry.prototype.Checkerator.prototype.maxAmbigLevel = function (){
	if (!this.maxvals.length){
		return true;
	}
	if (this.mode == "names"){
		//print(this.modepos+" : "+this.base[0].length+" : "+this.base[0][this.modepos]);
		if (this.modepos == (this.base["names"].length-1) && this.base["names"][this.modepos] == this.maxvals[this.modepos]){
			if (this.modes.length == 2){
				this.mode = "givens";
				this.modepos = 0;
				//this.pos = 0;
			} else {
				this.pos += 1;
				return true;
			}
		}
	}
	if (this.mode == "givens"){
		if (this.modepos == (this.mode1_counts.length-1) && this.mode1_counts[this.modepos] == (this.maxvals[this.modepos])){
			if (debug){
				print("-----  Item maxed out -----");
			}
			if (this.modes.length == 2){
				this.mode = "givens";
				this.pos += 1;
			} else {
				this.pos += 1;
			}
			//this.ids[this.pos] = false;
			return true;
		}
	}
	return false;
};
CSL.Factory.Registry.prototype.Checkerator.prototype.incrementAmbigLevel = function (){
	if (this.mode == "names"){
		var val = this.base["names"][this.modepos];
		if (val < this.maxvals[this.modepos]){
			this.base["names"][this.modepos] += 1;
		} else if (this.modepos < (this.base["names"].length-1)){
			this.modepos +=1;
			this.base["names"][this.modepos] = 0;
		}
	}
	if (this.mode == "givens"){
		var val = (this.mode1_counts[this.modepos]);
		if (val < this.maxvals[this.modepos]){
			this.mode1_counts[this.modepos] += 1;
			this.mode1_defaults = this.base["givens"][this.modepos].slice();
			this.base["givens"][this.modepos][val] += 1;
			if (debug){
				print("   ---> (A) Set expanded givenname param with base: "+this.base["givens"]);
			}
		} else if (this.modepos < (this.base["givens"].length-1)){
			this.modepos +=1;
			this.base["givens"][this.modepos][0] += 1;
			this.mode1_defaults = this.base["givens"][this.modepos].slice();
			if (debug){
				print("   ---> (B) Set expanded givenname param with base: "+this.base["givens"]);
			}
		} else {
			this.mode = "names";
			this.pos += 1;
		}
	}
};
CSL.Factory.Registry.prototype.registerAmbigToken = function (state,akey,id,ambig_config){
	if ( ! this.ambigs[akey]){
		this.ambigs[akey] = new Array();
	};
	var found = false;
	for (var i in this.ambigs[akey]){
		if (this.ambigs[akey].indexOf(id) > -1){
			found = true;
		}
	}
	if (!found){
		this.ambigs[akey].push(id);
	}
	this.registry[id].disambig = state.fun.clone_ambig_config(ambig_config);
};
CSL.Factory.Registry.prototype.decrementNames = function(state,base){
	var base_return = state.fun.clone_ambig_config(base);
	var do_me = false;
	for (var i=(base_return["givens"].length-1); i > -1; i--){
		for (var j=(base_return["givens"][i].length-1); j > -1; j--){
			if (base_return["givens"][i][j] == 2){
				do_me = true;
			}
		}
	}
	if (do_me){
		for (var i=(base_return["givens"].length-1); i > -1; i--){
			for (var j=(base_return["givens"][i].length-1); j > -1; j--){
				if (base_return["givens"][i][j] == 2){
					i = -1;
					break;
				}
				base_return["names"][i] += -1;
			}
		}
	}
	return base_return;
};
CSL.Lib = {};
//
// XXXXX Fix initialization of given name count.
// Should this be removed from the base?  not sure.
//
CSL.Lib.Elements = {};
CSL.Lib.Elements.style = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START){
			if (!state.build.lang){
				state.build.lang = "en";
			}
			state.opt.lang = state.build.lang;
			state.build.in_style = true;
			state.build.lang = false;
			state.opt.term = CSL.System.Retrieval.getLocaleObjects(state.opt.lang,state.opt.locale);
			state.tmp.term_predecessor = false;
		} else {
			state.tmp.disambig_request = false;
			state.build.in_style = false;
		}
		if (this.tokentype == CSL.START){
			var func = function(state,Item){
				if (state.tmp.disambig_request  && ! state.tmp.disambig_override){
					state.tmp.disambig_settings = state.tmp.disambig_request;
				} else if (state.registry.registry[Item.id] && ! state.tmp.disambig_override) {
					state.tmp.disambig_request = state.registry.registry[Item.id].disambig;
					state.tmp.disambig_settings = state.registry.registry[Item.id].disambig;
				} else {
					state.tmp.disambig_settings = new CSL.Factory.AmbigConfig();
				}
			};
			state["init"].push(func);
			var tracking_info_init = function(state,Item){
				state.tmp.names_used = new Array();
				state.tmp.nameset_counter = 0;
				state.tmp.years_used = new Array();
			};
			state["init"].push(tracking_info_init);
			var splice_init = function(state,Item) {
				state.tmp.splice_delimiter = state[state.tmp.area].opt.delimiter;
			};
			state["init"].push(splice_init);
			var sort_keys_init = function(state,Item) {
				state["bibliography_sort"].keys = new Array();
				state["citation_sort"].keys = new Array();
			};
			state["init"].push(sort_keys_init);
		};
		if (this.tokentype == CSL.END){
			var set_splice = function(state,Item){
				//
				// set the inter-cite join delimiter
				// here.
				if (state.tmp.last_suffix_used && state.tmp.last_suffix_used.match(/.*[-.,;:]$/)){
					state.tmp.splice_delimiter = " ";
				} else if (state.tmp.prefix.value() && state.tmp.prefix.value().match(/^[,,:;a-z].*/)){
					state.tmp.splice_delimiter = " ";
				} else if (state.tmp.last_suffix_used || state.tmp.prefix.value()){
					//
					// forcing the delimiter back to normal if a
					// suffix or prefix touch the join, even if
					// a year-suffix is the only output.
					state.tmp.splice_delimiter = state[state.tmp.area].opt.delimiter;
				} else {
					// XXXX year-suffix must have been used for special
					// XXXX delimiter to be invoked here.
				}
			};
			state["stop"].push(set_splice);
			var set_lastvals = function(state,Item){
				state.tmp.last_suffix_used = state.tmp.suffix.value();
				state.tmp.last_years_used = state.tmp.years_used.slice();
				state.tmp.last_names_used = state.tmp.names_used.slice();
			};
			state["stop"].push(set_lastvals);
			var func = function(state,Item){
				state.tmp.disambig_request = false;
			};
			state["stop"].push(func);
		}
	}
};
CSL.Lib.Elements.info = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START){
			state.build.skip = "info";
		} else {
			state.build.skip = false;
		}
	};
};
CSL.Lib.Elements.text = new function(){
	this.build = build;
	function build (state,target){
		//
		// CSL permits macros to be called before they
		// are declared.  We file a placeholder token unless we are
		// in the layout area, and when in the layout area we scan
		// any inserted macros for nested macro calls, and explode
		// them.
		if (state.build.postponed_macro){
			//
			// XXXX Could catch undeclared macros here.
			//
			if ( ! state.build.layout_flag && ! state.build.sort_flag){
				//
				// Fudge it with a placeholder if we're not yet
				// inside the layout area.
				this.postponed_macro = state.build.postponed_macro;
				target.push(this);
			} else {
				//
				// tag this token with the name of the postponed macro
				this.postponed_macro = state.build.postponed_macro;
				//
				// push an implict group token with the strings and
				// decorations of the invoking text tag
				var start_token = new CSL.Factory.Token("group",CSL.START);
				for (i in this.strings){
					start_token.strings[i] = this.strings[i];
				}
				start_token.decorations = this.decorations;
				var newoutput = function(state,Item){
					state.output.startTag("group",this);
					//state.tmp.decorations.push(this.decorations);
				};
				start_token["execs"].push(newoutput);
				target.push(start_token);
				//
				// Special handling for text macros inside a substitute
				// environment.
				if (state.build.names_substituting){
					//
					// A text macro inside a substitute environment is
					// treated as a special conditional.
					var choose_start = new CSL.Factory.Token("choose",CSL.START);
					target.push(choose_start);
					var if_start = new CSL.Factory.Token("if",CSL.START);
					//
					// Here's the Clever Part.
					// Set a test of the shadow if token to skip this
					// macro if we have acquired a name value.
					var check_for_variable = function(state,Item){
						if (state.tmp.value){
							return true;
						}
						return false;
					};
					if_start.tests.push(check_for_variable);
					//
					// this is cut-and-paste of the "any" evaluator
					// function, from Attributes.  These functions
					// should be defined in a namespace for reuse.
					var evaluator = function(state,Item){
						var res = this.fail;
						state.tmp.jump.replace("fail");
						for each (var func in this.tests){
							if (func.call(this,state,Item)){
								res = this.succeed;
								state.tmp.jump.replace("succeed");
								break;
							}
						}
						return res;
					};
					if_start.evaluator = evaluator;
					target.push(if_start);
					var macro = CSL.Factory.expandMacro.call(state,this);
					for each (var t in macro){
						target.push(t);
					}
					var if_end = new CSL.Factory.Token("if",CSL.END);
					target.push(if_end);
					var choose_end = new CSL.Factory.Token("choose",CSL.END);
					target.push(choose_end);
				} else {
					var macro = CSL.Factory.expandMacro.call(state,this);
					for each (var t in macro){
						target.push(t);
					}
				}
				var end_token = new CSL.Factory.Token("group",CSL.END);
				var mergeoutput = function(state,Item){
					//
					// rendering happens inside the
					// merge method, by applying decorations to
					// each token to be merged.
					state.output.endTag();
				};
				end_token["execs"].push(mergeoutput);
				target.push(end_token);
				state.build.names_substituting = false;
			}
			state.build.postponed_macro = false;
		} else {
			// ...
			//
			// Do non-macro stuff
			var variable = this.variables[0];
			if ("citation-number" == variable || "year-suffix" == variable){
				//
				// citation-number and year-suffix are super special,
				// because they are rangeables, and require a completely
				// different set of formatting parameters on the output
				// queue.
				if (variable == "citation-number"){
					//this.strings.is_rangeable = true;
					if ("citation-number" == state[state.tmp.area].opt["collapse"]){
						this.range_prefix = "-";
					}
					var func = function(state,Item){
						var id = Item["id"];
						if (!state.tmp.force_subsequent){
							var num = state.registry.registry[id].seq;
							var number = new CSL.Output.Number(num,this);
							state.output.append(number,"literal");
						}
					};
					this["execs"].push(func);
				} else if (variable == "year-suffix"){
					if (state[state.tmp.area].opt["year-suffix-range-delimiter"]){
						this.range_prefix = state[state.tmp.area].opt["year-suffix-range-delimiter"];
					}
					var func = function(state,Item){
						if (state.registry.registry[Item.id] && state.registry.registry[Item.id].disambig[2]){
							//state.output.append(state.registry.registry[Item.id].disambig[2],this);
							var num = parseInt(state.registry.registry[Item.id].disambig[2], 10);
							var number = new CSL.Output.Number(num,this);
							var formatter = new CSL.Util.Disambiguate.Suffixator(CSL.SUFFIX_CHARS);
							number.setFormatter(formatter);
							state.output.append(number,"literal");
							//
							// don't ask :)
							// obviously the variable naming scheme needs
							// a little touching up
							var firstoutput = state.tmp.term_sibling.mystack.indexOf(true) == -1;
							var specialdelimiter = state[state.tmp.area].opt["year-suffix-delimiter"];
							if (firstoutput && specialdelimiter && !state.tmp.sort_key_flag){
								state.tmp.splice_delimiter = state[state.tmp.area].opt["year-suffix-delimiter"];
							}
						}
					};
					this["execs"].push(func);
				}
			} else {
				if (state.build.term){
					var term = state.build.term;
					var form = "long";
					var plural = 0;
					if (state.build.form){
						form = state.build.form;
					}
					if (state.build.plural){
						plural = state.build.plural;
					}
					term = state.opt.term[term][form][plural];
					var printterm = function(state,Item){
						// capitalize the first letter of a term, if it is the
						// first thing rendered in a citation (or if it is
						// being rendered immediately after terminal punctuation,
						// I guess, actually).
						if (!state.tmp.term_predecessor){
							//print("Capitalize");
							term = CSL.Output.Formatters.capitalize_first(term);
							state.tmp.term_predecessor = false;
						};
						state.output.append(term,this);
					};
					this["execs"].push(printterm);
					state.build.term = false;
					state.build.form = false;
					state.build.plural = false;
				} else if (variable){
					var func = function(state,Item){
						if (this.variables.length){
							state.fun.mark_output(state,Item[variable]);
							state.output.append(Item[variable],this);
							//state.tmp.value.push(Item[variable]);
						}
					};
					this["execs"].push(func);
				} else if (this.strings.value){
					var func = function(state,Item){
						state.output.append(this.strings.value,this);
					};
					this["execs"].push(func);
				} else {
					var weird_output_function = function(state,Item){
						if (state.tmp.value.length){
							print("Weird output pattern.  Can this be revised?");
							for each (var val in state.tmp.value){
								state.output.append(val,this);
							}
							state.tmp.value = new Array();
						}
					};
					this["execs"].push(weird_output_function);
				}
			}
			target.push(this);
		};
	}
};
CSL.Lib.Elements.macro = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START){
			state.build.name = this.strings.name;
			var bufferlist = new Array();
			state.build.children.push(bufferlist);
		} else {
			//
			// catch repeated declarations of the same macro name
			if (state.build.macro[state.build.name]){
				throw "CSL processor error: repeated declaration of macro \""+state.build.name+"\"";
			}
			//
			// is this slice really needed?
			state.build.macro[state.build.name] = target.slice();
			state.build.name = false;
			state.build.children = new Array();;
		}
	}
};
CSL.Lib.Elements.locale = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			if (state.opt.lang && state.build.lang != state.opt.lang){
				state.build.skip = true;
			} else {
				state.build.skip = false;
			}
		}
	}
};
CSL.Lib.Elements.terms = new function(){
	this.build = build;
	function build(state,target){
	}
};
CSL.Lib.Elements.term = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START){
			var bufferlist = new Array();
			state.build.children.push(bufferlist);
			state.build.name = this.strings.name;
			state.build.form = this.strings.form;
		} else {
			if (state.build.text){
				var single = new CSL.Factory.Token("single",CSL.SINGLETON);
				var multiple = new CSL.Factory.Token("multiple",CSL.SINGLETON);
				target.push(single);
				target.push(multiple);
				for (i in target){
					target[i]["string"] = state.build.text;
				}
				state.build.text = false;
			}
			// set strings from throwaway tokens to term object
			var termstrings = new Array();
			// target should be pointing at the state.build.children
			// array, set by the start tag above
			for (i in target){
				termstrings.push(target[i].string);
			}
			// initialize object for this term
			if (!state.opt.term[state.build.name]){
				state.opt.term[state.build.name] = new Object();
			}
			//
			// long writes to long and any unused form key.
			//
			// short writes to short and to symbol if it is unused
			//
			// verb writes to verb and to verb-short if it is unused
			//
			// symbol and verb-short write only to themselves
			if (!state.build.form){
				state.build.form = "long";
			}
			var keywrites = new Object();
			keywrites["long"] = ["verb-short","symbol","verb","short","long"];
			keywrites["short"] = ["symbol"];
			keywrites["verb"] = ["verb-short"];
			keywrites["symbol"] = [];
			keywrites["verb-short"] = [];
			// forced write
			state.opt.term[state.build.name][state.build.form] = termstrings;
			if ( !state.build.in_style ){
				// shy write, performed only when external locale
				// is loaded.
				for each (var key in keywrites[state.build.form]){
					if (!state.opt.term[state.build.name][key]){
						state.opt.term[state.build.name][key] = termstrings;
					}
				}
			}
			state.build.name = false;
			state.build.form = false;
			state.build.children = new Array();
		}
	}
};
CSL.Lib.Elements.single = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.END){
			this["string"] = state.build.text;
			this["key"] = state.build.name;
			state.build.text = false;
			target.push(this);
		}
	}
};
CSL.Lib.Elements.multiple = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.END){
			this["string"] = state.build.text;
			this["key"] = state.build.name;
			state.build.text = false;
			target.push(this);
		}
	}
};
CSL.Lib.Elements.group = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START){
			var newoutput = function(state,Item){
				state.output.startTag("group",this);
			};
			//
			// Paranoia.  Assure that this init function is the first executed.
			var execs = new Array();
			execs.push(newoutput);
			this.execs = execs.concat(this.execs);
			var fieldcontentflag = function(state,Item){
				state.tmp.term_sibling.push( undefined, CSL.LITERAL );
			};
			this["execs"].push(fieldcontentflag);
		} else {
			var quashnonfields = function(state,Item){
				var flag = state.tmp.term_sibling.value();
				if (false == flag){
					state.output.clearlevel();
				}
				state.tmp.term_sibling.pop();
			};
			this["execs"].push(quashnonfields);
			var mergeoutput = function(state,Item){
				//
				// rendering happens inside the
				// merge method, by applying decorations to
				// each token to be merged.
				state.output.endTag();
			};
			this["execs"].push(mergeoutput);
		}
		target.push(this);
	}
};
CSL.Lib.Elements.citation = new function(){
	this.build = build;
	function build (state,target){
		if (this.tokentype == CSL.START) {
			state.build.area_return = state.build.area;
			state.build.area = "citation";
		}
		if (this.tokentype == CSL.END) {
			state.build.area = state.build.area_return;
		}
	}
};
CSL.Lib.Elements.choose = new function(){
	this.build = build;
	this.configure = configure;
	function build (state,target){
		if (this.tokentype == CSL.START){
			var func = function(state,Item){ //open condition
				state.tmp.jump.push(undefined, CSL.LITERAL);
			};
		}
		if (this.tokentype == CSL.END){
			var func = function(state,Item){ //close condition
				state.tmp.jump.pop();
			};
		}
		this["execs"].push(func);
		target.push(this);
	}
	function configure(state,pos){
		if (this.tokentype == CSL.END){
			state.configure["fail"].push((pos+1));
			state.configure["succeed"].push((pos+1));
		} else {
			state.configure["fail"].pop();
			state.configure["succeed"].pop();
		}
	}
};
CSL.Lib.Elements["if"] = new function(){
	this.build = build;
	this.configure = configure;
	function build (state,target){
		if (this.tokentype == CSL.START){
			if (! this.evaluator){
				//
				// cut and paste of "any"
				this.evaluator = function(state,Item){
					var res = this.fail;
					state.tmp.jump.replace("fail");
					for each (var func in this.tests){
						if (func.call(this,state,Item)){
							res = this.succeed;
							state.tmp.jump.replace("succeed");
							break;
						}
					}
					return res;
				};
			};
		}
		if (this.tokentype == CSL.END){
			var closingjump = function(state,Item){
				var next = this[state.tmp.jump.value()];
				return next;
			};
			this["execs"].push(closingjump);
		};
		target.push(this);
	}
	function configure(state,pos){
		if (this.tokentype == CSL.START){
			// jump index on failure
			this["fail"] = state.configure["fail"][(state.configure["fail"].length-1)];
			this["succeed"] = this["next"];
		} else {
			// jump index on success
			this["succeed"] = state.configure["succeed"][(state.configure["succeed"].length-1)];
			this["fail"] = this["next"];
		}
	}
};
CSL.Lib.Elements["else-if"] = new function(){
	this.build = build;
	this.configure = configure;
	function build (state,target){
		if (this.tokentype == CSL.START){
			if (! this.evaluator){
				//
				// cut and paste of "any"
				this.evaluator = function(state,Item){
					var res = this.fail;
					state.tmp.jump.replace("fail");
					for each (var func in this.tests){
						if (func.call(this,state,Item)){
							res = this.succeed;
							state.tmp.jump.replace("succeed");
							break;
						}
					}
					return res;
				};
			};
		}
		if (this.tokentype == CSL.END){
			var closingjump = function(state,Item){
				var next = this[state.tmp.jump.value()];
				return next;
			};
			this["execs"].push(closingjump);
		};
		target.push(this);
	}
	function configure(state,pos){
		if (this.tokentype == CSL.START){
			// jump index on failure
			this["fail"] = state.configure["fail"][(state.configure["fail"].length-1)];
			this["succeed"] = this["next"];
			state.configure["fail"][(state.configure["fail"].length-1)] = pos;
		} else {
			// jump index on success
			this["succeed"] = state.configure["succeed"][(state.configure["succeed"].length-1)];
			this["fail"] = this["next"];
		}
	}
};
CSL.Lib.Elements["else"] = new function(){
	this.build = build;
	this.configure = configure;
	function build (state,target){
		target.push(this);
	}
	function configure(state,pos){
		if (this.tokentype == CSL.START){
			state.configure["fail"][(state.configure["fail"].length-1)] = pos;
		}
	}
};
CSL.Lib.Elements.name = new function(){
	this.build = build;
	function build(state,target){
		state.build.form = this.strings.form;
		state.build.name_flag = true;
		var func = function(state,Item){
			state.output.addToken("name",false,this);
		};
		this["execs"].push(func);
		var set_initialize_with = function(state,Item){
			state.tmp["initialize-with"] = this.strings["initialize-with"];
		};
		this["execs"].push(set_initialize_with);
		target.push(this);
	};
};
CSL.Lib.Elements["name-part"] = new function(){
	this.build = build;
	function build(state,target){
		// XXXXX problem.  can't be global.  don't want to remint
		// for every rendering.  somehow get tokens stored on
		// closing names tag static.  always safe, b/c
		// no conditional branching inside names.
		// same treatment for etal styling element.
		var set_namepart_format = function(state,Item){
			state.output.addToken(state.tmp.namepart_type,false,this);
		};
		this["execs"].push(set_namepart_format);
		target.push(this);
	};
};
CSL.Lib.Elements.label = new function(){
	this.build = build;
	function build(state,target){
		if (state.build.name_flag){
			this.strings.label_position = CSL.AFTER;
		} else {
			this.strings.label_position = CSL.BEFORE;
		}
		var set_label_info = function(state,Item){
			if (!this.strings.form){
				this.strings.form = "long";
			}
			state.output.addToken("label",false,this);
		};
		this["execs"].push(set_label_info);
		target.push(this);
	};
};
CSL.Lib.Elements.substitute = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			state.build.names_substituting = true;
			var declare_thyself = function(state,Item){
				state.tmp.names_substituting = true;
			};
			this["execs"].push(declare_thyself);
		};
		target.push(this);
	};
};
CSL.Lib.Elements["et-al"] = new function(){
	this.build = build;
	function build(state,target){
		var set_et_al_format = function(state,Item){
			state.output.addToken("etal",false,this);
		};
		this["execs"].push(set_et_al_format);
		target.push(this);
	};
};
CSL.Lib.Elements.layout = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			state.build.layout_flag = true;
			var set_opt_delimiter = function(state,Item){
				// just in case
				state.tmp.sort_key_flag = false;
				state[state.tmp.area].opt.delimiter = "";
				if (this.strings.delimiter){
					state[state.tmp.area].opt.delimiter = this.strings.delimiter;
				};
			};
			this["execs"].push(set_opt_delimiter);
			var reset_nameset_counter = function(state,Item){
				state.tmp.nameset_counter = 0;
			};
			this["execs"].push(reset_nameset_counter);
			var declare_thyself = function(state,Item){
				//
				// This is not very pretty.
				//
				state[state.tmp.area].opt.layout_prefix = this.strings.prefix;
				state[state.tmp.area].opt.layout_suffix = this.strings.suffix;
				state[state.tmp.area].opt.layout_decorations = this.decorations;
				state.output.openLevel("empty");
			};
			this["execs"].push(declare_thyself);
		};
		if (this.tokentype == CSL.END){
			state.build.layout_flag = false;
			var mergeoutput = function(state,Item){
				state.output.closeLevel();
				state.tmp.name_quash = new Object();
			};
			this["execs"].push(mergeoutput);
		}
		target.push(this);
	};
};
CSL.Lib.Elements.number = new function(){
	this.build = build;
	function build(state,target){
		target.push(this);
	};
};
CSL.Lib.Elements.date = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			var set_value = function(state,Item){
				state.tmp.value.push(Item[this.variables[0]]);
			};
			this["execs"].push(set_value);
			var newoutput = function(state,Item){
				state.output.startTag("date",this);
			};
			this["execs"].push(newoutput);
		} else if (this.tokentype == CSL.END){
			var mergeoutput = function(state,Item){
				state.output.endTag();
			};
			this["execs"].push(mergeoutput);
		}
		target.push(this);
	};
};
CSL.Lib.Elements["date-part"] = new function(){
	this.build = build;
	function build(state,target){
		var value = "";
		if (!this.strings.form){
			this.strings.form = "long";
		}
		var render_date_part = function(state,Item){
			for each (var val in state.tmp.value){
				value = val[this.strings.name];
				break;
			};
			var real = !state.tmp.suppress_decorations;
			var invoked = state[state.tmp.area].opt.collapse == "year-suffix";
			var precondition = state[state.tmp.area].opt["disambiguate-add-year-suffix"];
			if (real && precondition && invoked){
				state.tmp.years_used.push(value);
				var known_year = state.tmp.last_years_used.length >= state.tmp.years_used.length;
				if (known_year){
					if (state.tmp.last_years_used[(state.tmp.years_used.length-1)] == value){
						value = false;
					}
				}
			}
			if (value){
				if (this.strings.form){
					value = CSL.Util.Dates[this.strings.name][this.strings.form](state,value);
				}
				//state.output.startTag(this.strings.name,this);
				state.output.append(value,this);
				//state.output.endTag();
			};
			state.tmp.value = new Array();
		};
		this["execs"].push(render_date_part);
		target.push(this);
	};
};
CSL.Lib.Elements.option = new function(){
	this.build = build;
	function build(state,target){
		if (this.strings.name == "collapse"){
			// only one collapse value will be honoured.
			if (this.strings.value){
				state[state.tmp.area].opt.collapse = this.strings.value;
			}
		}
		if (CSL.ET_AL_NAMES.indexOf(this.strings.name) > -1){
			if (this.strings.value){
				state[state.tmp.area].opt[this.strings.name] = parseInt(this.strings.value, 10);
			}
		}
		if (CSL.DISAMBIGUATE_OPTIONS.indexOf(this.strings.name) > -1){
			state[state.tmp.area].opt[this.strings.name] = true;
		}
		if ("year-suffix-delimiter" == this.strings.name){
			state[state.tmp.area].opt["year-suffix-delimiter"] = this.strings.value;
		}
		if ("year-suffix-range-delimiter" == this.strings.name){
			state[state.tmp.area].opt["year-suffix-range-delimiter"] = this.strings.value;
		}
		target.push(this);
	};
};
CSL.Lib.Elements.bibliography = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			state.build.area_return = state.build.area;
			state.build.area = "bibliography";
			//var init_sort_keys = function(state,Item){
			//	state.tmp.sort_keys = new Array();
			//};
			//this["execs"].push(init_sort_keys);
		}
		if (this.tokentype == CSL.END){
			state.build.area = state.build.area_return;
		}
		target.push(this);
	};
};
CSL.Lib.Elements.sort = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START){
			state.build.sort_flag  = true;
			state.build.area_return = state.build.area;
			state.build.area = state.build.area+"_sort";
		}
		if (this.tokentype == CSL.END){
			state.build.area = state.build.area_return;
			state.build.sort_flag  = false;
		}
	};
};
CSL.Lib.Elements.key = new function(){
	this.build = build;
	function build(state,target){
		var start_key = new CSL.Factory.Token("key",CSL.START);
		start_key.strings["et-al-min"] = this.strings["et-al-min"];
		start_key.strings["et-al-use-first"] = this.strings["et-al-use-first"];
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
			//
			// should default to the area value, with these as override.
			// be sure that the area-level value is set correctly, then
			// do this up.  lots of inheritance, so lots of explicit
			// conditions, but it's all very systematic and boring.
			//
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
		if (state.build.key_is_variable){
			state.build.key_is_variable = false;
			var single_text = new CSL.Factory.Token("text",CSL.SINGLETON);
			single_text["execs"] = this["execs"].slice();
			var output_variables = function(state,Item){
				for each(var val in state.tmp.value){
					if (val == "citation-number"){
						state.output.append(state.registry.registry[Item["id"]].seq.toString(),"empty");
					} else {
						state.output.append(val,"empty");
					}
				}
			};
			single_text["execs"].push(output_variables);
			target.push(single_text);
		} else {
			//
			// if it's not a variable, it's a macro
			var token = new CSL.Factory.Token("text",CSL.SINGLETON);
			token.postponed_macro = state.build.postponed_macro;
			var macro = CSL.Factory.expandMacro.call(state,token);
			for each (var t in macro){
				target.push(t);
			}
			state.build.postponed_macro = false;
		}
		//
		// ops to output the key string result to an array go
		// on the closing "key" tag before it is pushed.
		// Do not close the level.
		var end_key = new CSL.Factory.Token("key",CSL.END);
		var store_key_for_use = function(state,Item){
			var keystring = state.output.string(state,state.output.queue);
			if (false){
				print("keystring: "+keystring);
			}
			state[state.tmp.area].keys.push(keystring);
			state.tmp.value = new Array();
		};
		end_key["execs"].push(store_key_for_use);
		var reset_key_params = function(state,Item){
			state.tmp.name_quash = new Object();
			state.tmp["et-al-min"] = false;
			state.tmp["et-al-use-first"] = false;
			state.tmp.sort_key_flag = false;
		};
		end_key["execs"].push(reset_key_params);
		target.push(end_key);
	};
};
CSL.Lib.Elements.names = new function(){
	this.build = build;
	function build(state,target){
		if (this.tokentype == CSL.START || this.tokentype == CSL.SINGLETON){
			var init_names = function(state,Item){
				if (state.tmp.value.length == 0){
					for each (var variable in this.variables){
						//
						// If the item has been marked for quashing, skip it.
						if (Item[variable] && ! state.tmp.name_quash[variable]){
							state.fun.mark_output(state,Item[variable]);
							state.tmp.names_max.push(Item[variable].length);
							state.tmp.value.push({"type":variable,"names":Item[variable]});
							// saving relevant names separately, for reference
							// in splice collapse
							state.tmp.names_used.push(state.tmp.value.slice());
						}
					};
				}
			};
			this["execs"].push(init_names);
		};
		if (this.tokentype == CSL.START){
			state.build.names_flag = true;
			var set_et_al_params = function(state,Item){
				state.output.startTag("names",this);
				//
				// No value or zero means a first reference,
				// anything else is a subsequent reference.
				if (Item.position || state.tmp.force_subsequent){
						if (! state.tmp["et-al-min"]){
							if (state[state.tmp.area].opt["et-al-subsequent-min"]){
								state.tmp["et-al-min"] = state[state.tmp.area].opt["et-al-subsequent-min"];
							} else {
								state.tmp["et-al-min"] = state[state.tmp.area].opt["et-al-min"];
							}
						}
						if (! state.tmp["et-al-use-first"]){
							if (state[state.tmp.area].opt["et-al-subsequent-use-first"]){
								state.tmp["et-al-use-first"] = state[state.tmp.area].opt["et-al-subsequent-use-first"];
							} else {
								state.tmp["et-al-use-first"] = state[state.tmp.area].opt["et-al-use-first"];
							}
						}
				} else {
						if (! state.tmp["et-al-min"]){
							state.tmp["et-al-min"] = state[state.tmp.area].opt["et-al-min"];
						}
						if (! state.tmp["et-al-use-first"]){
							state.tmp["et-al-use-first"] = state[state.tmp.area].opt["et-al-use-first"];
						}
				}
			};
			this["execs"].push(set_et_al_params);
		};
		if (this.tokentype == CSL.END){
			var handle_names = function(state,Item){
				var namesets = new Array();
				var common_term = state.fun.get_common_term(state,state.tmp.value);
				if (common_term){
					namesets = state.tmp.value.slice(0,1);
				} else {
					namesets = state.tmp.value;
				}
				var local_count = 0;
				var nameset = new Object();
				state.output.addToken("space"," ");
				state.output.addToken("sortsep",state.output.getToken("name").strings["sort-separator"]);
				if (!state.output.getToken("etal")){
					state.output.addToken("etal-join",", ");
					state.output.addToken("etal");
				} else {
					state.output.addToken("etal-join","");
				}
				if (!state.output.getToken("label")){
					state.output.addToken("label");
				}
				if (!state.output.getToken("etal").strings.et_al_term){
					state.output.getToken("etal").strings.et_al_term = state.opt.term["et-al"]["long"][0];
				}
				state.output.addToken("commasep",", ");
				for each (namepart in ["secondary-key","primary-key","prefix","suffix"]){
					if (!state.output.getToken(namepart)){
						state.output.addToken(namepart);
					}
				}
				for  (var namesetIndex in namesets){
					nameset = namesets[namesetIndex];
					if (!state.tmp.suppress_decorations && (state[state.tmp.area].opt.collapse == "year" || state[state.tmp.area].opt.collapse == "year-suffix")){
						if (state.tmp.last_names_used.length == state.tmp.names_used.length){
							var lastones = state.tmp.last_names_used[state.tmp.nameset_counter];
							var currentones = state.tmp.names_used[state.tmp.nameset_counter];
							var compset = currentones.concat(lastones);
							if (state.fun.get_common_term(state,compset)){
								continue;
							}
						}
					}
					if (!state.tmp.disambig_request){
						state.tmp.disambig_settings["givens"][state.tmp.nameset_counter] = new Array();
					}
					//
					// Here is where we maybe truncate the list of
					// names, to satisfy the et-al constraints.
					var display_names = nameset.names.slice();
					var sane = state.tmp["et-al-min"] >= state.tmp["et-al-use-first"];
					//
					// if there is anything on name request, we assume that
					// it was configured correctly via state.names_request
					// by the function calling the renderer.
					var discretionary_names_length = state.tmp["et-al-min"];
					//
					// if rendering for display, do not honor a disambig_request
					// to set names length below et-al-use-first
					//
					if (state.tmp.suppress_decorations){
						if (state.tmp.disambig_request){
							discretionary_names_length = state.tmp.disambig_request["names"][state.tmp.nameset_counter];
						} else if (display_names.length >= state.tmp["et-al-min"]){
							discretionary_names_length = state.tmp["et-al-use-first"];
						}
					} else {
						if (state.tmp.disambig_request && state.tmp["et-al-use-first"] < state.tmp.disambig_request["names"][state.tmp.nameset_counter]){
							discretionary_names_length = state.tmp.disambig_request["names"][state.tmp.nameset_counter];
						} else if (display_names.length >= state.tmp["et-al-min"]){
							discretionary_names_length = state.tmp["et-al-use-first"];
						}
					}
					var overlength = display_names.length > discretionary_names_length;
					var et_al = false;
					var and_term = false;
					if (sane && overlength){
						if (! state.tmp.sort_key_flag){
							et_al = state.output.getToken("etal").strings.et_al_term;
						}
						display_names = display_names.slice(0,discretionary_names_length);
					} else {
						if (state.output.getToken("name").strings["and"] && ! state.tmp.sort_key_flag && display_names.length > 1){
							and_term = state.output.getToken("name").strings["and"];
						}
					}
					state.tmp.disambig_settings["names"][state.tmp.nameset_counter] = display_names.length;
					local_count += display_names.length;
					//
					// "name" is the format for the outermost nesting of a nameset
					// "inner" is a format consisting only of a delimiter, used for
					// joining all but the last name in the set together.
					var delim = state.output.getToken("name").strings.delimiter;
					state.output.addToken("inner",delim);
					//state.tmp.tokenstore["and"] = new CSL.Factory.Token("and");
					if (and_term){
						state.output.formats.value()["name"].strings.delimiter = and_term;
					}
					for (var i in nameset.names){
						//
						// set the display mode default for givennames if required
						if (state.tmp.disambig_request){
							//
							// fix a request for initials that makes no sense.
							// can't do this in disambig, because the availability
							// of initials is not a global parameter.
							var val = state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][i];
							if (val == 1 && ! state.tmp["initialize-with"]){
								val = 2;
							}
							var param = val;
						} else {
							var param = 2;
							if (state.output.getToken("name").strings.form == "short"){
								param = 0;
							} else if ("string" == typeof state.tmp["initialize-with"]){
								param = 1;
							}
						}
						state.tmp.disambig_settings["givens"][state.tmp.nameset_counter][i] = param;
					}
					//
					// configure label if poss
					var label = false;
					if (state.output.getToken("label").strings.label_position){
						var term;
						if (common_term){
							term = common_term;
						} else {
							term = state.opt.term[nameset.type];
						}
						if (nameset.names.length > 1){
							label = term[state.output.getToken("label").strings.form][1];
						} else {
							label = term[state.output.getToken("label").strings.form][0];
						}
					};
					//
					// Nesting levels are opened to control joins with
					// content at the end of the names block
					//
					// Gotcha.  Don't want to use startTag here, it pushes
					// a fresh format token namespace, and we lose our pointer.]
					// Use openLevel (and possibly addToken) instead.
					state.output.openLevel("empty"); // for term join
					if (label && state.output.getToken("label").strings.label_position == CSL.BEFORE){
						state.output.append(label,"label");
					}
					state.output.openLevel("etal-join"); // join for etal
					CSL.Util.Names.outputNames(state,display_names);
					if (et_al){
						state.output.append(et_al,"etal");
					}
					state.output.closeLevel(); // etal
					if (label && state.tmp.name_label_position != CSL.BEFORE){
						state.output.append(label,"label");
					}
					state.output.closeLevel(); // term
					state.tmp.nameset_counter += 1;
				};
				if (state.output.getToken("name").strings.form == "count"){
					state.output.clearlevel();
					state.output.append(local_count.toString());
					state.tmp["et-al-min"] = false;
					state.tmp["et-al-use-first"] = false;
				}
			};
			this["execs"].push(handle_names);
		};
		if (this.tokentype == CSL.END && state.build.form == "count" && false){
			state.build.form = false;
			var output_name_count = function(state,Item){
				var name_count = 0;
				for each (var v in this.variables){
					if(Item[v] && Item[v].length){
						name_count += Item[v].length;
					}
				}
				state.output.append(name_count.toString());
			};
			this["execs"].push(output_name_count);
		};
		if (this.tokentype == CSL.END){
			var unsets = function(state,Item){
				state.fun.names_reinit(state,Item);
				state.output.endTag(); // names
			};
			this["execs"].push(unsets);
			state.build.names_flag = false;
			state.build.name_flag = false;
		}
		target.push(this);
	}
};CSL.Lib.Attributes = {};
CSL.Lib.Attributes["@value"] = function(state,arg){
	this.strings.value = arg;
};
CSL.Lib.Attributes["@name"] = function(state,arg){
	this.strings.name = arg;
};
CSL.Lib.Attributes["@form"] = function(state,arg){
	this.strings.form = arg;
};
CSL.Lib.Attributes["@macro"] = function(state,arg){
	state.build.postponed_macro = arg;
};
CSL.Lib.Attributes["@term"] = function(state,arg){
	if (this.name == "et-al"){
		if (state.opt.term[arg]){
			this.strings.et_al_term = state.opt.term[arg]["long"][0];
		} else {
			this.strings.et_al_term = arg;
		}
	}
	state.build.term = arg;
};
CSL.Lib.Attributes["@xmlns"] = function(state,arg){};
CSL.Lib.Attributes["@lang"] = function(state,arg){
	if (arg){
		state.build.lang = arg;
	}
};
CSL.Lib.Attributes["@class"] = function(state,arg){
	state.opt["class"] = arg;
};
CSL.Lib.Attributes["@type"] = function(state,arg){
	if (this.name == "name-part") {
		//
		// Note that there will be multiple name-part items,
		// and they all need to be collected before doing anything.
		// So this must be picked up when the <name-part/>
		// element is processed, and used as a key on an
		// object holding the formatting attribute functions.
		state.tmp.namepart_type = arg;
	} else {
		var func = function(state,Item){
			if(Item.type == arg){
				return true;
			}
			return false;
		};
		this["tests"].push(func);
	}
};
CSL.Lib.Attributes["@variable"] = function(state,arg){
	if (this.tokentype == CSL.SINGLETON){
		if (this.name == "text"){
			this.variables = arg.split(/\s+/);
		};
		if (this.name == "key"){
			//
			// this one is truly wild.  the key element
			// will be recast as a start and end tag, so this
			// function will be copied across to the TEXT
			// tag that the key tags will enclose.  the text
			// of the variable will render to an output queue
			// that is dedicated to producing sort keys.
			state.build.key_is_variable = true;
			var func = function(state,Item){
				if ("citation-number" == arg){
					state.tmp.value.push("citation-number");
				} else {
					state.tmp.value.push(Item[arg]);
				}
			};
			this["execs"].push(func);
		};
		if (this.name == "label"){
			//
			// labels treat the "locator" variable specially.
			print("Note to self: do something for variable= on label elements.");
		}
	};
	if (this.tokentype == CSL.START){
		if (["if","else-if"].indexOf(this.name) > -1){
			var variables = arg.split(/\s+/);
			for each (var variable in variables){
				var func = function(state,Item){
					if (Item[variable]){
						return true;
					}
					return false;
				};
				this["tests"].push(func);
			};
		};
		if (this.name == "date"){
			var func = function(state,Item){
				state.fun.mark_output(state,Item[arg]);
				state.tmp.value.push(Item[arg]);
			};
			this["execs"].push(func);
		};
	};
	if (this.name == "names" && (this.tokentype == CSL.START || this.tokentype == CSL.SINGLETON)){
		if (arg){
			this.variables = arg.split(/\s+/);
		};
	};
};
CSL.Lib.Attributes["@and"] = function(state,arg){
	if ("symbol" == arg){
		this.strings["and"] = " & ";
	} else {
		var and = state.opt.term["and"]["long"][0];
		if (and.match(/.*[a-zA-Z\u0400-\u052f].*/)){
			and = ", "+and+" ";
		}
		this.strings["and"] = and;
	}
};
CSL.Lib.Attributes["@initialize-with"] = function(state,arg){
	this.strings["initialize-with"] = arg;
};
CSL.Lib.Attributes["@suffix"] = function(state,arg){
	this.strings.suffix = arg;
};
CSL.Lib.Attributes["@prefix"] = function(state,arg){
	this.strings.prefix = arg;
};
CSL.Lib.Attributes["@delimiter"] = function(state,arg){
	this.strings.delimiter = arg;
};
CSL.Lib.Attributes["@match"] = function(state,arg){
	if (this.tokentype == CSL.START){
		if ("none" == arg){
			var evaluator = function(state,Item){
				var res = this.succeed;
				state.tmp.jump.replace("succeed");
				for each (var func in this.tests){
					if (func.call(this,state,Item)){
						res = this.fail;
						state.tmp.jump.replace("fail");
						break;
					}
				}
				return res;
			};
		} else if ("any" == arg){
			var evaluator = function(state,Item){
				var res = this.fail;
				state.tmp.jump.replace("fail");
				for each (var func in this.tests){
					if (func.call(this,state,Item)){
						res = this.succeed;
						state.tmp.jump.replace("succeed");
						break;
					}
				}
				return res;
			};
		} else if ("all" == arg){
			var evaluator = function(state,Item){
				var res = this.succeed;
				state.tmp.jump.replace("succeed");
				for each (var func in this.tests){
					if (!func.call(this,state,Item)){
						res = this.fail;
						state.tmp.jump.replace("fail");
						break;
					}
				}
				return res;
			};
		} else {
			throw "Unknown match condition \""+arg+"\" in @match";
		}
		this.evaluator = evaluator;
	};
};
CSL.Lib.Attributes["@sort-separator"] = function(state,arg){
	this.strings["sort-separator"] = arg;
};
CSL.Lib.Attributes["@delimiter-precedes-last"] = function(state,arg){
	this.strings["delimiter-precedes-last"] = arg;
};
CSL.Lib.Attributes["@name-as-sort-order"] = function(state,arg){
	this.strings["name-as-sort-order"] = arg;
};
CSL.Lib.Attributes["@is-numeric"] = function(state,arg){
	var variables = arg.split(/\s+/);
	for each (var variable in variables){
		var func = function(state,Item){
			if (CSL.NUMERIC_VARIABLES.indexOf(variable) == -1){
				return false;
			}
			var val = Item[variable];
			if (typeof val == "undefined"){
				return false;
			}
			if (typeof val == "number"){
				val = val.toString();
			}
			if (typeof val != "string"){
				return false;
			}
			if (val.match(CSL.QUOTED_REGEXP)){
				return false;
			}
			if (val.match(CSL.NUMBER_REGEXP)){
				return true;
			}
			return false;
		};
		this["tests"].push(func);
	};
};
CSL.Lib.Attributes["@names-min"] = function(state,arg){
	this.strings["et-al-min"] = parseInt(arg, 10);
};
CSL.Lib.Attributes["@names-use-first"] = function(state,arg){
	this.strings["et-al-use-first"] = parseInt(arg,10);
};
CSL.Lib.Attributes["@sort"] = function(state,arg){
	if (arg == "descending"){
		this.strings.sort_direction = CSL.DESCENDING;
	}
}
CSL.Lib.Attributes["@plural"] = function(state,arg){
};
CSL.Lib.Attributes["@locator"] = function(state,arg){
};
CSL.Lib.Attributes["@include-period"] = function(state,arg){
};
CSL.Lib.Attributes["@position"] = function(state,arg){
};
CSL.Lib.Attributes["@disambiguate"] = function(state,arg){
	if (this.tokentype == CSL.START && ["if","else-if"].indexOf(this.name) > -1){
		if (arg == "true"){
			state.opt.has_disambiguate = true;
			var func = function(state,Item){
				if (state.tmp.disambig_settings["disambiguate"]){
					return true;
				}
				return false;
			};
			this["tests"].push(func);
		};
	};
};
CSL.Output = {};
CSL.Output.Queue = function(state){
	this.state = state;
	this.queue = new Array();
	this.empty = new CSL.Factory.Token("empty");
	var tokenstore = {};
	tokenstore["empty"] = this.empty;
	this.formats = new CSL.Factory.Stack( tokenstore );
	this.current = new CSL.Factory.Stack( this.queue );
	this.suppress_join_punctuation = false;
};
CSL.Output.Queue.prototype.getToken = function(name){
	var ret = this.formats.value()[name];
	return ret;
};
// Store a new output format token based on another
CSL.Output.Queue.prototype.addToken = function(name,modifier,token){
	var newtok = new CSL.Factory.Token("output");
	if ("string" == typeof token){
		token = this.formats.value()[token];
	}
	if (token && token.strings){
		for (attr in token.strings){
			newtok.strings[attr] = token.strings[attr];
		}
		newtok.decorations = token.decorations;
	}
	if ("string" == typeof modifier){
		newtok.strings.delimiter = modifier;
	}
	this.formats.value()[name] = newtok;
};
//
// newFormat adds a new bundle of formatting tokens to
// the queue's internal stack of such bundles
CSL.Output.Queue.prototype.pushFormats = function(tokenstore){
	if (!tokenstore){
		tokenstore = new Object();
	}
	tokenstore["empty"] = this.empty;
	this.formats.push(tokenstore);
};
CSL.Output.Queue.prototype.popFormats = function(tokenstore){
	this.formats.pop();
};
CSL.Output.Queue.prototype.startTag = function(name,token){
	var tokenstore = {};
	tokenstore[name] = token;
	this.pushFormats( tokenstore );
	this.openLevel(name);
}
CSL.Output.Queue.prototype.endTag = function(){
	this.closeLevel();
	this.popFormats();
}
//
// newlevel adds a new blob object to the end of the current
// list, and adjusts the current pointer so that subsequent
// appends are made to blob list of the new object.
CSL.Output.Queue.prototype.openLevel = function(token){
	if (!this.formats.value()[token]){
		throw "CSL processor error: call to nonexistent format token \""+token+"\"";
	}
	var blob = new CSL.Factory.Blob(this.formats.value()[token]);
	var curr = this.current.value();
	curr.push( blob );
	this.current.push( blob );
};
CSL.Output.Queue.prototype.closeLevel = function(name){
	this.current.pop();
}
//
// append does the same thing as newlevel, except
// that the blob it pushes has text content,
// and the current pointer is not moved after the push.
CSL.Output.Queue.prototype.append = function(str,tokname){
	var blob = false;
	if (!tokname){
		var token = this.formats.value()["empty"];
	} else if (tokname == "literal"){
		var token = true;
		blob = str;
	} else if ("string" == typeof tokname){
		var token = this.formats.value()[tokname];
	} else {
		var token = tokname;
	}
	if (!token){
		throw "CSL processor error: unknown format token name: "+tokname;
	}
	if (!blob){
		blob = new CSL.Factory.Blob(token,str);
	}
	var bloblist = this.state.fun.flipflopper.compose(blob);
	if (bloblist.length > 1){
		this.openLevel("empty");
		var curr = this.current.value();
		for each (var blobbie in bloblist){
			curr.push( blobbie );
		}
		this.closeLevel();
	} else {
		var curr = this.current.value();
		curr.push( blob );
	}
	this.state.tmp.term_predecessor = true;
}
CSL.Output.Queue.prototype.string = function(state,blobs,blob){
	var ret;
	ret = { "str": [], "obj": [] };
	if (blobs.length == 1 && "string" == blobs[0].blobs){
		ret["str"] = blobs[0];
	} else {
		for each (var blobjr in blobs){
			var strPlus = {"str":"","obj":[]};
			if ("string" == typeof blobjr.blobs){
				if ("number" == typeof blobjr.num){
					strPlus["obj"] = blobjr;
				} else {
					strPlus["str"] = blobjr.blobs;
				}
			} else {
				strPlus = this.string(state,blobjr.blobs,blobjr);
			};
			//
			// If there is a suffix, or any decorations, trailing rangeable
			// objects must be rendered and appended immediately here.
			//
			if (strPlus["obj"].length && (blobjr.strings.suffix || (blobjr.decorations && blobjr.decorations.length))){
				strPlus["str"] = strPlus["str"] + state.output.renderBlobs(strPlus["obj"]);
				strPlus["obj"] = [];
			}
			if (strPlus["str"]){
				if (!state.tmp.suppress_decorations){
					for each (var params in blobjr.decorations){
						strPlus["str"] = state.fun.decorate[params[0]][params[1]](strPlus["str"]);
					}
				}
				strPlus["str"] = blobjr.strings.prefix + strPlus["str"] + blobjr.strings.suffix;
				ret["str"].push(strPlus["str"]);
			}
			//
			// this passes rangeable objects through
			ret["obj"] = ret["obj"].concat(strPlus["obj"]);
		};
		if (blob) {
			ret["str"] = ret["str"].join(blob.strings.delimiter);
		} else {
			if (state.tmp.handle_ranges){
				ret["str"] = ret["str"].join("");
			} else {
				ret = ret["str"].join("");
			}
		}
	};
	this.queue = new Array();
	this.current.mystack = new Array();
	this.current.mystack.push( this.queue );
	return ret;
};
CSL.Output.Queue.prototype.clearlevel = function(){
	var blob = this.current.value();
	for (var i=(blob.blobs.length-1); i > -1; i--){
		blob.blobs.pop();
	}
};
CSL.Output.Queue.prototype.renderBlobs = function(blobs){
	var state = this.state;
	var ret = "";
	for (var i=0; i < blobs.length; i++){
		if (blobs[i].checkNext){
			blobs[i].checkNext(blobs[(i+1)]);
		}
	}
	for each (var blob in blobs){
		if ("string" == typeof blob){
			//throw "Attempt to render string as rangeable blob"
			ret += blob;
		} else if (blob.status != CSL.SUPPRESS){
			// print("doing rangeable blob");
			//var str = blob.blobs;
			var str = blob.formatter.format(blob.num);
			if (!state.tmp.suppress_decorations){
				for each (var params in blob.decorations){
					str = state.fun.decorate[params[0]][params[1]](str);
				}
			}
			str = blob.strings.prefix + str + blob.strings.suffix;
			if (blob.status == CSL.END){
				//
				// XXXXX needs to be drawn from the object
				ret += blob.range_prefix;
			} else if (blob.status == CSL.SUCCESSOR){
				ret += blob.successor_prefix;
			} else if (blob.status == CSL.START){
				ret += blob.splice_prefix;
			}
			ret += str;
		}
	}
	return ret;
};
CSL.Output.Formatters = new function(){};
CSL.Output.Formatters.passthrough = function(string){
	return string;
};
//
// XXXXX
// A bit of interest coming up with vertical-align.
// This needs to include the prefixes and suffixes
// in its scope, so it's applied last, AFTER they
// are appended to the string.  I think it's the
// only one that will need to work that way.
CSL.Output.Formatters.lowercase = function(string) {
	if ("object" == typeof string){
		var ret = new Array();
		for each (item in string){
			ret.push(item.LowerCase());
		}
		return ret;
	}
	return string.LowerCase();
};
CSL.Output.Formatters.uppercase = function(string) {
	if ("object" == typeof string){
		var ret = new Array();
		for each (item in string){
			ret.push(item.toUpperCase());
		}
		return ret;
	}
	return string.toUpperCase();
};
CSL.Output.Formatters.capitalize_first = function(string) {
	return string[0].toUpperCase()+string.substr(1);
};
CSL.Output.Formatters.sentence_capitalization = function(string) {
	return string[0].toUpperCase()+string.substr(1).toLowerCase();
};
CSL.Output.Formatters.capitalize_all = function(string) {
	var strings = string.split(" ");
	for(var i=0; i<strings.length; i++) {
		if(strings[i].length > 1) {
            strings[i] = strings[i][0].toUpperCase()+strings[i].substr(1).toLowerCase();
        } else if(strings[i].length == 1) {
            strings[i] = strings[i].toUpperCase();
        }
    }
	return strings.join(" ");
};
CSL.Output.Formatters.title_capitalization = function(string) {
	if (!string) {
		return "";
	}
	var words = string.split(delimiterRegexp);
	var isUpperCase = string.toUpperCase() == string;
	var newString = "";
	var delimiterOffset = words[0].length;
	var lastWordIndex = words.length-1;
	var previousWordIndex = -1;
	for(var i=0; i<=lastWordIndex; i++) {
		// only do manipulation if not a delimiter character
		if(words[i].length != 0 && (words[i].length != 1 || !delimiterRegexp.test(words[i]))) {
			var upperCaseVariant = words[i].toUpperCase();
			var lowerCaseVariant = words[i].toLowerCase();
				// only use if word does not already possess some capitalization
				if(isUpperCase || words[i] == lowerCaseVariant) {
					if(
						// a skip word
						skipWords.indexOf(lowerCaseVariant.replace(/[^a-zA-Z]+/, "")) != -1
						// not first or last word
						&& i != 0 && i != lastWordIndex
						// does not follow a colon
						&& (previousWordIndex == -1 || words[previousWordIndex][words[previousWordIndex].length-1] != ":")
					) {
							words[i] = lowerCaseVariant;
					} else {
						// this is not a skip word or comes after a colon;
						// we must capitalize
						words[i] = upperCaseVariant[0] + lowerCaseVariant.substr(1);
					}
				}
				previousWordIndex = i;
		}
		newString += words[i];
	}
	return newString;
};
CSL.Output.Formats = function(){};
CSL.Output.Formats.prototype.html = {
	"@font-family":"<span style=\"font-family:%%PARAM%%\">%%STRING%%</span>",
	"@font-style/italic":"<i>%%STRING%%</i>",
	"@font-style/normal":"<span style=\"font-style:normal\">%%STRING%%</span>",
	"@font-style/oblique":"<em>%%STRING%%</em>",
	"@font-variant/small-caps":"<span style=\"font-variant:small-caps\">%%STRING%%</span>",
	"@font-variant/normal":false,
	"@font-weight/bold":"<b>%%STRING%%</b>",
	"@font-weight/normal":false,
	"@font-weight/light":false,
	"@text-decoration/none":false,
	"@text-decoration/underline":"<span style=\"text-decoration:underline\">%%STRING%%</span>",
	"@vertical-align/baseline":false,
	"@vertical-align/sup":"<sup>%%STRING%%</sup>",
	"@vertical-align/sub":"<sub>%%STRING%%</sub>",
	"@text-case/lowercase":CSL.Output.Formatters.lowercase,
	"@text-case/uppercase":CSL.Output.Formatters.uppercase,
	"@text-case/capitalize-first":CSL.Output.Formatters.capitalize_first,
	"@text-case/capitalize-all":CSL.Output.Formatters.capitalize_all,
	"@text-case/title":CSL.Output.Formatters.title_capitalization,
	"@text-case/sentence":CSL.Output.Formatters.sentence_capitalization,
	"@quotes/true":"&ldquo;%%STRING%%&rdquo;",
	"@quotes/left":"&ldquo;%%STRING%%",
	"@quotes/right":"%%STRING%%&rdquo;",
	"@quotes/noop":"%%STRING%%",
	"@squotes/true":"&lsquo;%%STRING%%&rsquo;",
	"@squotes/left":"&lsquo;%%STRING%%",
	"@squotes/right":"%%STRING%%&rsquo;",
	"@squotes/noop":"%%STRING%%"
};
CSL.Output.Formats = new CSL.Output.Formats();CSL.Output.Number = function(num,mother_token){
	this.num = num;
	this.blobs = num.toString();
	this.status = CSL.START;
	this.strings = new Object();
	if (mother_token){
		this.decorations = mother_token.decorations;
		this.strings.prefix = mother_token.strings.prefix;
		this.strings.suffix = mother_token.strings.suffix;
		this.successor_prefix = mother_token.successor_prefix;
		this.range_prefix = mother_token.range_prefix;
		this.splice_prefix = "";
		this.formatter = mother_token.formatter;
		if (!this.formatter){
			this.formatter =  new CSL.Output.DefaultFormatter();
		}
		if (this.formatter){
			this.type = this.formatter.format(1);
		}
	} else {
		this.decorations = new Array();
		this.strings.prefix = "";
		this.strings.suffix = "";
		this.successor_prefix = "";
		this.range_prefix = "";
		this.splice_prefix = "";
		this.formatter = new CSL.Output.DefaultFormatter();
	}
};
CSL.Output.Number.prototype.setFormatter = function(formatter){
	this.formatter = formatter;
	this.type = this.formatter.format(1);
};
CSL.Output.DefaultFormatter = function (){};
CSL.Output.DefaultFormatter.prototype.format = function (num){
	return num.toString();
};
CSL.Output.Number.prototype.checkNext = function(next){
	if ( ! next || ! next.num || this.type != next.type || next.num != (this.num+1)){
		if (this.status == CSL.SUCCESSOR_OF_SUCCESSOR){
			this.status = CSL.END;
		}
	} else { // next number is in the sequence
		if (this.status == CSL.START){
			next.status = CSL.SUCCESSOR;
		} else if (this.status == CSL.SUCCESSOR || this.status == CSL.SUCCESSOR_OF_SUCCESSOR){
			if (this.range_prefix){
				next.status = CSL.SUCCESSOR_OF_SUCCESSOR;
				this.status = CSL.SUPPRESS;
			} else {
				next.status = CSL.SUCCESSOR;
			}
		}
	};
};
CSL.System = {};
CSL.System.Xml = {};
CSL.System.Xml.E4X = function(){};
CSL.System.Xml.E4X.prototype.clean = function(xml){
	xml = xml.replace(/<\?[^?]+\?>/g,"");
	xml = xml.replace(/<![^>]+>/g,"");
	xml = xml.replace(/^\s+/g,"");
	xml = xml.replace(/\s+$/g,"");
	return xml;
};
CSL.System.Xml.E4X.prototype.parse = function(xml){
	default xml namespace = "http://purl.org/net/xbiblio/csl";
	return XML( this.clean(xml) );
};
CSL.System.Xml.E4X.prototype.commandInterface = new function(){
	this.children = children;
	this.nodename = nodename;
	this.attributes = attributes;
	this.content = content;
	this.numberofnodes = numberofnodes;
	function children(){
		return this.children();
	};
	function nodename(){
		return this.localName();
	}
	function attributes(){
		var ret = new Object();
		var attrs = this.attributes();
		for (var idx in attrs){
			var key = "@"+attrs[idx].localName();
			var value = attrs[idx].toString();
			ret[key] = value;
		}
		return ret;
	}
	function content(){
		return this.toString();
	}
	function numberofnodes(){
		return this.length();
	}
};
CSL.System.Xml.E4X = new CSL.System.Xml.E4X();
CSL.System.Xml.JunkyardJavascript = function(){};
CSL.System.Xml.JunkyardJavascript.prototype.clean = function(xml) {
	xml = xml.replace(/\n/g,"");
	xml = xml.replace(/\>\s+/g,">");
	xml = xml.replace(/\s+\</g,"<");
	var xmllist = xml.split(/(<[^>]+>)/);
	var newlist = new Array();
	var i;
	var tag = false;
	var tagname = false;
	for (i=0; i<xmllist.length; i++) {
		if (xmllist[i]) {
			newlist.push(xmllist[i]);
		}
	}
	xmllist = newlist;
	newlist = new Array();
	for (i=0; i<xmllist.length; i++){
		tag = xmllist[i];
		if (tag[0] == "<" && (tag[1] == "?" || tag[1] == "!")){
			continue;
		}
		// only validate XML tag type things
		if (tag[0] == "<"){
			try {
				tagname = tag.match(/^.(\/*[a-zA-Z]+).*/)[1];
			} catch(e) {
				throw "CSL.System.Xml: bad XML markup: "+e;
			}
		}
		newlist.push(tag);
	}
	return newlist;
};
CSL.System.Xml.JunkyardJavascript.prototype.parse = function(xml){
	xml = this.clean(xml);
	var token = new Array();
	token.name = this.getName(xml[0]);
	token.attributes = this.getAttributes(xml[0]);
	token = this._makeToken(token,xml);
	return [token];
};
CSL.System.Xml.JunkyardJavascript.prototype.commandInterface = new function(){
	this.children = children;
	this.nodename = nodename;
	this.attributes = attributes;
	this.content = content;
	this.numberofnodes = numberofnodes;
	function children(){
		// it's like, you know, [[],[[],[]],[]]
		return this.slice(0);
	};
	function nodename(){
		return this.name;
	}
	function attributes(){
		return this.attributes;
	}
	function content(){
		return this.text;
	}
	function numberofnodes(){
		return this.length;
	}
};
CSL.System.Xml.JunkyardJavascript.prototype._makeToken = function(token,xml){
	xml = xml.slice(1,(xml.length-1));
	var pos = 0;
	while (pos <xml.length){
		if (this.isEndtag(xml[pos])){
			pos += 1;
			continue;
		}
		var newtoken = new Array();
		newtoken.name = this.getName(xml[pos]);
		newtoken.attributes = this.getAttributes(xml[pos]);
		if (!newtoken.name){
			newtoken.name = null;
			newtoken.attributes = new Object();
			newtoken.text = xml[pos];
		} else {
			var span = this.getSpan(xml.slice(pos));
			if (span && span.length){
				newtoken = this._makeToken(newtoken,span);
				pos += (span.length-1);
			};
		};
		token.push(newtoken);
		pos += 1;
	};
	return token;
};
CSL.System.Xml.JunkyardJavascript.prototype.getName = function(tag){
		var m = tag.match(/<\/*(?:[a-z]+:){0,1}([-a-z]+).*/);
		if (!m){
			return false;
		}
		return m[1];
};
CSL.System.Xml.JunkyardJavascript.prototype.getAttributes = function(tag){
	var attributes = new Object();
	var match;
	var rex = /([-:a-z]+)\s*=\s*(\\*\")(.*?[^\\])\2\s*/;
	tag = tag.replace(/^[^\s]+\s*/,"");
	tag = tag.replace(/[^\"]+$/,"");
	while (tag.match(rex)) {
		var attr = false;
		var args = false;
		match = tag.match(rex);
		attr = match[1];
		attr = attr.replace(/^[-a-z]+:/,"");
		attr = "@"+attr;
		args = match[3];
		//args = match[3].split(/\s+/);
		attributes[attr] = args;
		tag = tag.substr((match[0].length-1));
	}
	return attributes;
};
CSL.System.Xml.JunkyardJavascript.prototype.isEndtag = function(tag){
	if ("/" == tag.substr(1,1)){
		return true;
	}
	return false;
};
CSL.System.Xml.JunkyardJavascript.prototype.isSingleton = function(tag){
	if ("<" != tag[0] || "/" == tag.substr((tag.length-2),1)){
		return true;
	};
	return false;
};
CSL.System.Xml.JunkyardJavascript.prototype.getSpan =	function(xml){
	var i;
	var end = 0;
	var depth = 0;
	var firsttag = this.getName(xml[0]);
	if (this.isSingleton(xml[0])){
		return new Array();
	}
	for (i=0; i<xml.length; i++){
		if (firsttag == this.getName(xml[i])){
			if (this.isEndtag(xml[i])){
				depth += -1;
			} else {
				depth += 1;
			}
		}
		if (depth == 0){
			end = i;
			break;
		}
	}
	return xml.slice(0,(end+1));
};
CSL.System.Xml.JunkyardJavascript.prototype.stripParent = function(xml){
	return xml.slice(1,(xml.length-1));
};
CSL.System.Xml.JunkyardJavascript = new CSL.System.Xml.JunkyardJavascript();
CSL.System.Retrieval = function(){};
CSL.System.Retrieval.GetInput = function(){
	this.input = new Object();
};
CSL.System.Retrieval.GetInput.prototype.setInput = function(state,item){
	this.input[item.id] = item;
}
CSL.System.Retrieval.GetInput.prototype.getInput = function(name){
	var ret = new Array();
	if ("object" == typeof name && name.length){
		for each (filename in name){
			if (this.input[filename]){
				ret.push(this.input[filename]);
			} else {
				var datastring = readFile("data/" + filename + ".txt");
				eval( "obj = " + datastring );
				CSL.System.Tests.fixNames([obj],filename);
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
			CSL.System.Tests.fixNames([obj],filename);
			ret.push(obj);
		}
	} else {
		throw "Failure reading test data file, WTF?";
	}
	return ret;
}
CSL.System.Retrieval.getLocaleObjects = function(lang,locale){
	if ( ! locale ){
		try {
			var locale = readFile( "./locale/"+localeRegistry()[lang] );
		} catch (e){
			throw "Unable to load locale for "+lang+".";
		}
	}
	var builder = new CSL.Core.Build(locale);
	builder.build();
	return builder.state.opt.term;
	function localeRegistry (){
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
};
var _slashRe = /^(.*?)\b([0-9]{1,4})(?:([\-\/\.\u5e74])([0-9]{1,2}))?(?:([\-\/\.\u6708])([0-9]{1,4}))?\b(.*?)$/;
var _yearRe = /^(.*?)\b((?:circa |around |about |c\.? ?)?[0-9]{1,4}(?: ?B\.? ?C\.?(?: ?E\.?)?| ?C\.? ?E\.?| ?A\.? ?D\.?)|[0-9]{3,4})\b(.*?)$/i;
var _monthRe = null;
var _dayRe = null;
CSL.System.Retrieval.strToDate = function(string) {
	var date = new Object();
	if(!string) {
		return date;
	}
	string = string.toString().replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/, " ");
	var m = _slashRe.exec(string);
	var pre = m[1];
	var num1 = m[2];
	var div1_2 = m[3];
	var num2 = m[4];
	var div2_3 = m[5];
	var num3 = m[6];
	var post = m[7];
	if(m){
		var sane = (!m[5] || m[3] == m[5] || (m[3] == "\u5e74" && m[5] == "\u6708"));
		var got_data = ((m[2] && m[4] && m[6]) || (!m[1] && !m[7]));
		if (sane && got_data){
			// figure out date based on parts
			if(num1.length == 3 || num1.length == 4 || div1_2 == "\u5e74") {
				// ISO 8601 style date (big endian)
				date.year = num1;
				date.month = num2;
				date.day = num3;
			} else {
				// local style date (middle or little endian)
				date.year = num3;
				//
				// XXXX This is going to need some help
				var country = "US";
				if(country == "US" ||	// The United States
				   country == "FM" ||	// The Federated States of Micronesia
				   country == "PW" ||	// Palau
				   country == "PH") {	// The Philippines
					date.month = num1;
					date.day = num2;
				} else {
					date.month = num2;
					date.day = num1;
				}
			}
			if(date.year) {
				date.year = parseInt(date.year, 10);
			}
			if(date.day) {
				date.day = parseInt(date.day, 10);
			}
			if(date.month) {
				date.month = parseInt(date.month, 10);
				if(date.month > 12) {
					// swap day and month
					var tmp = date.day;
					date.day = date.month;
					date.month = tmp;
				}
			}
			if((!date.month || date.month <= 12) && (!date.day || date.day <= 31)) {
				if(date.year && date.year < 100) {	// for two digit years, determine proper
													// four digit year
					var today = new Date();
					var year = today.getFullYear();
					var twoDigitYear = year % 100;
					var century = year - twoDigitYear;
					if(date.year <= twoDigitYear) {
						// assume this date is from our century
						date.year = century + date.year;
					} else {
						// assume this date is from the previous century
						date.year = century - 100 + date.year;
					}
				}
				// subtract one for JS style
				if(date.month){
					date.month--;
				}
				date.part = pre+post;
			} else {
				//
				// give up; we failed the sanity check
				date = {"part":string};
			}
		} else {
			date.part = string;
		}
	} else {
		date.part = string;
	}
	if(!date.year) {
		var m = _yearRe.exec(date.part);
		if(m) {
			date.year = num1;
			date.part = pre+d1_2;
		}
	}
	if(!date.month) {
		// compile month regular expression
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
			'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		// If using a non-English bibliography locale, try those too
		if (Zotero.CSL.Global.locale != 'en-US') {
			months = months.concat(Zotero.CSL.Global.getMonthStrings("short"));
		}
		if(!_monthRe) {
			_monthRe = new RegExp("^(.*)\\b("+months.join("|")+")[^ ]*(?: (.*)$|$)", "i");
		}
		var m = _monthRe.exec(date.part);
		if(m) {
			// Modulo 12 in case we have multiple languages
			date.month = months.indexOf(m[2][0].toUpperCase()+m[2].substr(1).toLowerCase()) % 12;
			date.part = m[1]+m[3];
		}
	}
	if(!date.day) {
		// compile day regular expression
		if(!_dayRe) {
			var daySuffixes = Zotero.getString("date.daySuffixes").replace(/, ?/g, "|");
			_dayRe = new RegExp("\\b([0-9]{1,2})(?:"+daySuffixes+")?\\b(.*)", "i");
		}
		var m = _dayRe.exec(date.part);
		if(m) {
			var day = parseInt(m[1], 10);
			// Sanity check
			if (day <= 31) {
				date.day = day;
				if(m.index > 0) {
					date.part = date.part.substr(0, m.index);
					if(m[2]) {
						date.part += " "+m[2];;
					}
				} else {
					date.part = m[2];
				}
			}
		}
	}
	if(date.part) {
		date.part = date.part.replace(/^[^A-Za-z0-9]+/, "").replace(/[^A-Za-z0-9]+$/, "");
		if(!date.part.length) {
			date.part = undefined;
		}
	}
	return date;
};
CSL.System.Tests = function(){};
CSL.System.Tests.getTest = function(myname){
	var test;
	var filename = "std/machines/" + myname + ".json";
	var teststring = readFile(filename);
	try {
		eval( "test = "+teststring );
	} catch(e){
		throw e + teststring;
	}
	if (test.mode == "bibliography"){
		var render = "makeBibliography";
	} else {
		var render = "makeCitationCluster";
	}
	test.run = function(){
		var builder = new CSL.Core.Build(this.csl);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		if (this.flipflops){
			for each (var ff in this.flipflops){
				style.fun.flipflopper.register( ff["start"], ff["end"], ff["func"], ff["alt"], ff["additive"] );
			}
		}
		CSL.System.Tests.fixNames(this.input,myname);
		for each (var item in this.input){
			style.fun.retriever.setInput(style,item);
			style.registry.insert(style,item);
		}
		if (this.citations){
			for each (var cite_cluster in this.citations){
				var cluster = [];
				for each (var cite in cite_cluster){
					for each (var datem in this.input){
						if (datem.id == cite.id){
							cluster.push(datem);
							break;
						}
					}
				}
				var ret = style[render](cluster);
			}
		} else {
			var ret = style[render](this.input);
		}
		return ret;
	};
	return test;
};
CSL.System.Tests.fixNames = function(itemlist,myname){
	for each (obj in itemlist){
		if (!obj.id){
			throw "No id for object in: "+myname;
		}
		for each (key in ["author","editor","translator"]){
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
	return itemlist;
};
