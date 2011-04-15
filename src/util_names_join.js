CSL.NameOutput.prototype.joinPersons = function (blobs, pos) {
	var ret;
	if (this.etal_spec[pos] === 1) {
		ret = this._joinEtAl(blobs);
	} else if (this.etal_spec[pos] === 2) {
		ret = this._joinEllipsis(blobs);
	} else {
		ret = this._joinAnd(blobs, "name");
	}
	return ret;
};


CSL.NameOutput.prototype.joinInstitutionSets = function (blobs, pos) {
	var ret;
	if (this.etal_spec[pos] === 1) {
		ret = this._joinEtAl(blobs);
	} else if (this.etal_spec[pos] === 2) {
		ret = this._joinEllipsis(blobs);
	} else {
		ret = this._joinAnd(blobs, "institution");
	}
	return ret;
};


CSL.NameOutput.prototype.joinPersonsAndInstitutions = function (blobs) {
	//
	return this._join(blobs, this.name.strings.delimiter);
};

CSL.NameOutput.prototype.joinFreetersAndInstitutionSets = function (blobs) {
	// Nothing, one or two, never more
	var ret = this._join(blobs, "[never here]", this["with"].single, this["with"].multiple);
	return ret;
};


CSL.NameOutput.prototype._joinEtAl = function (blobs) {
	//
    var blob = this._join(blobs, this.name.strings.delimiter);
	if (!blob) {
		ret = false;
	}
	
	// notSerious
	this.state.output.openLevel("empty");
	this.state.output.append(blob, "literal", true);
	if (blobs.length > 1) {
		this.state.output.append(this["et-al"].multiple, "literal", true);
	} else if (blobs.length === 1) {
		this.state.output.append(this["et-al"].single, "literal", true);
	}
	this.state.output.closeLevel("empty");
	return this.state.output.pop();
};


CSL.NameOutput.prototype._joinEllipsis = function (blobs) {
	return this._join(blobs, this.name.strings.delimiter, this.name.ellipsis.single, this.name.ellipsis.multiple);
};


CSL.NameOutput.prototype._joinAnd = function (blobs, type) {
	return this._join(blobs, this[type].strings.delimiter, this[type].and.single, this[type].and.multiple);
};


CSL.NameOutput.prototype._join = function (blobs, delimiter, single, multiple) {
	if (!blobs) {
		return false;
	}
	// Eliminate false and empty blobs
	for (var i = blobs.length - 1; i > -1; i += -1) {
		if (!blobs[i] || !blobs[i].blobs.length) {
			blobs = blobs.slice(0, i).concat(blobs.slice(i + 1));
		}
	}
	// XXXX This needs some attention before moving further.
	// Code is not sufficiently transparent.
	if (!blobs.length) {
		return false;
	} else if (single && blobs.length === 2) {
		blobs = [blobs[0], single, blobs[1]];
	} else {
		if (multiple) {
			var delimiter_offset = 2;
		} else {
			var delimiter_offset = 1;
		}
		// It kind of makes sense down to here.
		for (var i = 0, ilen = blobs.length - delimiter_offset; i < ilen; i += 1) {
			blobs[i].strings.suffix += delimiter;
		}
		if (blobs.length > 1) {
			var blob = blobs.pop();
			if (multiple) {
				blobs.push(multiple);
			} else {
				blobs.push(single);
			}
			blobs.push(blob);
		}
	}
	this.state.output.openLevel("empty");
	for (var i = 0, ilen = blobs.length; i < ilen; i += 1) {
		this.state.output.append(blobs[i], false, true);
	}
	this.state.output.closeLevel("empty");
	return this.state.output.pop();
};


/*
 else {
		if (!state.tmp.sort_key_flag) {
			if (display_names.length > 1) {
				if (this.state.output.getToken("name").strings.and) {
					and_term = this.state.output.getToken("name").strings.and;
				}
			}
		}
	}
 */

