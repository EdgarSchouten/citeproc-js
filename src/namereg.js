dojo.provide("csl.namereg");

/**
 * The idea here will be to store names in a nested hierarchy
 * of declining ambiguity (surname, initial, given name), with
 * a query mechanism to return the correct disambig value for
 * the surname.  Each time a name is added or deleted, the query
 * mechanism is run, and the result is stored in names_inf for
 * rapid delivery via an external query method.
 *
 * What should happen is that names are filed in a
 * names registry when they are used.  so state.registry.names=(new something).
 * then a call to a method of the registry object for that name will return the
 * lowest acceptable value for the current configuration state.
 * var lev = state.registry.names(state,name);, like.
 *
 * This could be extended later to a simplification of all names
 * disambiguation, by returning both the minimum AND maximum
 * name config values from this method.  That would put all the
 * initialize-with etc jiggery-pokery in one place, and the
 * disambiguation machinery would not need to be cluttered up with
 * it; you would just increment and decrement name config values
 * within the range.  But that's for later.  For now, we just
 * set a floor value and use the existing machinery.
 *
 * No, the extension might as well happen now.  Setting the ceiling
 * through this function will bring all of the names parameters into
 * this space, where they can be easily seen and controlled.  Very
 * hard adjustments in the disambiguation machinery, but small steps,
 * man, small steps.
 *
 */
CSL.Factory.Registry.prototype.NameReg = function(state){
	//this.state = state;
	this.namereg = new Object();
	this.nameids = new Object();
	var pkey;
	var ikey;
	var skey;

	var _set_keys = function(nameobj){
		pkey = nameobj["primary-key"];
		var secondary = nameobj["secondary-key"];
		if (!secondary){
			secondary = "";
		}
		ikey = pkey+"::"+CSL.Util.Names.initializeWith(secondary,"");
		skey = pkey+"::"+secondary.replace("."," ").replace(/\s+/," ");
	};

	var eval = function(nameobj,namenum,form,initials){
		// return vals
		var floor;
		var ceiling;

		_set_keys(nameobj);
		// keys
		var pkey_is_unique = this.namereg[pkey] == 1;
		var ikey_is_unique = this.namereg[ikey] == 1;
		var skey_is_unique = this.namereg[skey] == 1;
		// params
		//
		// possible options are:
		//
		// <option disambiguate-add-givenname value="true"/> (a)
		// <option disambiguate-add-givenname value="all-names"/> (a)
		// <option disambiguate-add-givenname value="all-names-with-initials"/> (b)
		// <option disambiguate-add-givenname value="all-names-with-fullname"/> (c)
		// <option disambiguate-add-givenname value="primary-name"/> (d)
		// <option disambiguate-add-givenname value="primary-name-with-initials"/> (e)
		// <option disambiguate-add-givenname value="primary-name-with-fullname"/> (f)
		// <option disambiguate-add-givenname value="by-cite"/> (g)
		//
		var param = 2;
		var opt = state[state.tmp.area].opt["disambiguate-add-givenname"];
		//
		// set initial value
		//
		if ("short" == form){
			param = 0;
		} else if ("string" == typeof initials){
			param = 1;
		};
		//
		// adjust value upward if appropriate
		//
		if ("string" == typeof opt && opt.slice(0,12) == "primary-name" && namenum > 0){
			return param;
		};
		//
		// the last composite condition is for backward compatibility
		//
		if (opt == "all-names" || opt == "primary-name" || ("boolean" == typeof opt && opt == true)){
			if (!pkey_is_unique){
				param = 1;
			};
			if (!ikey_is_unique){
				param = 2;
			}
		} else if (opt == "all-names-with-initials" || opt == "primary-name-with-initials"){
			if (!pkey_is_unique){
				param = 1;
			}
		} else if (opt == "all-names-with-fullname" || opt == "primary-name-with-fullname"){
			if (!pkey_is_unique){
				param = 2;
			}
		};
		return param;
	};

	var del = function(nameobj){
		_set_keys(nameobj);
		if (pkey){
			this.namereg[skey] += -1;
			if (this.namereg[skey] == 0){
				delete this.namereg[skey];
				this.namereg[pkey] += -1;
				this.namereg[ikey] += -1;
			};
			if (this.namereg[ikey] == 0){
				delete this.namereg[ikey];
			};
			if (this.namereg[pkey] == 0){
				delete this.namereg[pkey];
			};
		};
	};

	//
	// Oooooooh, this is hard.  The problem is where to call
	// this method from.  It can't be called on all names in an
	// Item, because that will be overaggressive (there might be
	// only one name actually visible in printed output).
	//
	// If it's called per-name at render time, that should work
	// okay (I think), but also need to be careful to call
	// del method if the name is unwound during disambiguation
	// (disambiguate-add-names).
	//
	// There's a problem, though.  Suppose [Alex] Smith, Book A (2000).
	// Then suppose a later cite to [Arnold] Smith, Book B (1990).  The
	// two sources are not in the same disambig set.  A separate tracking
	// registry is needed for names, so that a request for re-rendering
	// can be issued when the name form changes.
	//
	// And this needs to play nice with the existing machinery.
	// Swell.  Just swell.
	//
	var add = function(id,nameobj){
		if (!this.nameids[id]){
			this.nameids[id] = true;
		} else {
			return;
		};
		_set_keys(nameobj);
		if (pkey){
			if ("undefined" == typeof this.namereg[pkey]){
				this.namereg[pkey] = 0;
			};
			if ("undefined" == typeof this.namereg[skey]){
				this.namereg[skey] = 0;
				if ("undefined" == typeof this.namereg[ikey]){
					this.namereg[ikey] = 0;
				};
				this.namereg[pkey] += 1;
				this.namereg[ikey] += 1;
			};
			this.namereg[skey] += 1;
		};
	};
	this.add = add;
	this.del = del;
	this.eval = eval;
};
