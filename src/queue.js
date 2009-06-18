dojo.provide("csl.queue");

/**
 * Output queue object.
 * @class
 */
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
	var tokenstore = new Object();
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
	//print("openLevel");
	if (!this.formats.value()[token]){
		throw "CSL processor error: call to nonexistent format token \""+token+"\"";
	}
	//print("newlevel: "+token);
	//
	// delimiter, prefix, suffix, decorations from token
	var blob = new CSL.Factory.Blob(this.formats.value()[token]);
	var curr = this.current.value();
	curr.push( blob );
	this.current.push( blob );
};

/**
 * "merge" used to be real complicated, now it's real simple.
 */
CSL.Output.Queue.prototype.closeLevel = function(name){
	//print("closeLevel");
	//print("merge");
	this.current.pop();
}

//
// append does the same thing as newlevel, except
// that the blob it pushes has text content,
// and the current pointer is not moved after the push.

CSL.Output.Queue.prototype.append = function(str,tokname){
	if ("undefined" == typeof str){
		return;
	};
	if (this.state.tmp.element_trace && this.state.tmp.element_trace.value() == "suppress-me"){
		return;
	}
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
			if ("string" == typeof blobbie.blobs){
				this.state.tmp.term_predecessor = true;
			}
			curr.push( blobbie );
		}
		this.closeLevel();
	} else {
		var curr = this.current.value();
		if ("string" == typeof blob.blobs){
			this.state.tmp.term_predecessor = true;
		}
		curr.push( blob );
	}
}

//
// Maybe the way to do this is to take it by layers, and
// analyze a FLAT list of blobs returned during recursive
// execution.  If the list is all numbers and there is no
// group decor, don't touch it.  If it ends in numbers,
// set the group delimiter on the first in the series,
// and join the strings with the group delimiter.  If it
// has numbers followed by strings, render each number
// in place, and join with the group delimiter.  Return
// the mixed flat list, and recurse upward.
//
// That sort of cascade should work, and should be more
// easily comprehensible than this mess.
//

CSL.Output.Queue.prototype.string = function(state,myblobs,blob){
	var blobs = myblobs.slice();
	var ret = new Array();
	if (blobs.length == 0){
		return ret;
	}
	for (var i in blobs){
		var blobjr = blobs[i];
		if ("string" == typeof blobjr.blobs){
			if ("number" == typeof blobjr.num){
				ret.push(blobjr);
			} else if (blobjr.blobs){
				// skip empty strings!!!!!!!!!!!!
				var b = blobjr.blobs;
				if (!state.tmp.suppress_decorations){
					for each (var params in blobjr.decorations){
						b = state.fun.decorate[params[0]][params[1]](state,b);
					};
				};
				if (b[(b.length-1)] == "." && blobjr.strings.suffix && blobjr.strings.suffix[0] == "."){
					b = blobjr.strings.prefix + b + blobjr.strings.suffix.slice(1);
				} else {
					b = blobjr.strings.prefix + b + blobjr.strings.suffix;
				}
				ret.push(b);
			};
		} else if (blobjr.blobs.length){
			var addtoret = state.output.string(state,blobjr.blobs,blobjr);
			ret = ret.concat(addtoret);
		} else {
			continue;
		}
	};
	var span_split = 0;
	for (var j in ret){
		if ("string" == typeof ret[j]){
			span_split = (parseInt(j,10)+1);
		}
	}
	if (blob && (blob.decorations.length || blob.strings.suffix || blob.strings.prefix)){
		span_split = ret.length;
	}
	if (blob){
		var blob_delimiter = blob.strings.delimiter;
	} else {
		var blob_delimiter = "";
	}
	var blobs_start = state.output.renderBlobs( ret.slice(0,span_split), blob_delimiter );
	if (blobs_start && blob && (blob.decorations.length || blob.strings.suffix || blob.strings.prefix)){
		if (!state.tmp.suppress_decorations){
			for each (var params in blob.decorations){
				blobs_start = state.fun.decorate[params[0]][params[1]](state,blobs_start);
			}
		}
		//
		// XXXX: this is same as a code block above, factor out with
		// code above as model
		//
		var b = blobs_start;
		if (b[(b.length-1)] == "." && blob.strings.suffix && blob.strings.suffix[0] == "."){
			b = blob.strings.prefix + b + blob.strings.suffix.slice(1);
		} else {
			b = blob.strings.prefix + b + blob.strings.suffix;
		}
		blobs_start = b;
	}
	var blobs_end = ret.slice(span_split,ret.length);
	if (!blobs_end.length && blobs_start){
		ret = [blobs_start];
	} else if (blobs_end.length && !blobs_start) {
		ret = blobs_end;
	} else if (blobs_start && blobs_end.length) {
		ret = [blobs_start].concat(blobs_end);
	}
	//
	// Blobs is now definitely a string with
	// trailing blobs.  Return it.
	if ("undefined" == typeof blob){
		this.queue = new Array();
		this.current.mystack = new Array();
		this.current.mystack.push( this.queue );
		if (state.tmp.suppress_decorations){
			ret = state.output.renderBlobs(ret);
		}
	} else if ("boolean" == typeof blob){
		ret = state.output.renderBlobs(ret);
	}
	return ret;
};

CSL.Output.Queue.prototype.clearlevel = function(){
	var blob = this.current.value();
	for (var i=(blob.blobs.length-1); i > -1; i--){
		blob.blobs.pop();
	}
};

CSL.Output.Queue.prototype.renderBlobs = function(blobs,delim){
	//print("blobs to render: "+blobs);
	if (!delim){
		delim = "";
	}
	var state = this.state;
	var ret = "";
	var use_delim = "";
	for (var i=0; i < blobs.length; i++){
		if (blobs[i].checkNext){
			blobs[i].checkNext(blobs[(i+1)]);
		}
	}
	for each (var blob in blobs){
		if (ret){
			use_delim = delim;
		}
		if ("string" == typeof blob){
			//throw "Attempt to render string as rangeable blob"
			ret += use_delim;
			ret += blob;
		} else if (blob.status != CSL.SUPPRESS){
			// print("doing rangeable blob");
			//var str = blob.blobs;
			var str = blob.formatter.format(blob.num);
			if (!state.tmp.suppress_decorations){
				for each (var params in blob.decorations){
					str = state.fun.decorate[params[0]][params[1]](state,str);
				}
			}
			//if (!suppress_decor){
				str = blob.strings.prefix + str + blob.strings.suffix;
			//}
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
