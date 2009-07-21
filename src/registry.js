dojo.provide("csl.registry");

//
// Time for a rewrite of this module.
//
// Simon has pointed out that list and hash behavior can
// be obtained by ... just using a list and a hash.  This
// is faster for batched operations, because sorting is
// greatly optimized.  Since most of the interaction
// with plugins at runtime will involve batches of
// references, there will be solid gains if the current,
// one-reference-at-a-time approach implemented here
// can be replaced with something that leverages the native
// sort method of the Array() type.
//
// That's going to take some redesign, but it will simplify
// things in the long run, so it might as well happen now.
//
// We'll keep makeCitationCluster and makeBibliography as
// simple methods that return a string.  Neither should
// have any effect on internal state.  This will be a change
// in behavior for makeCitationCluster.
//
// A new updateItems command will be introduced, to replace
// insertItems.  It will be a simple list of IDs, in the
// sequence of first reference in the document.
//
// The calling application should always invoke updateItems
// before makeCitationCluster.
//

//
// should allow batched registration of items by
// key.  should behave as an update, with deletion
// of items and the tainting of disambiguation
// partner sets affected by a deletes and additions.
//
//
// we'll need a reset method, to clear the decks
// in the citation area and start over.

/**
 * Registry of cited items.
 * <p>This is a persistent store of disambiguation and
 * sort order information relating to individual items
 * for which rendering is requested.  Item data is stored
 * in a hash, with the item key as hash key, for quick
 * retrieval.  A virtual sequence within the hashed store
 * is maintained on the fly as items are added to the
 * store, using <code>*_next</code> and <code>*_prev</code>
 * attributes on each item.  A separate hash of items
 * based on their undisambiguated cite form is
 * maintained, and the item id list and disambiguation
 * level for each set of disambiguation partners is shared
 * through the registry item.</p>
 * @class
 */
CSL.Factory.Registry = function(state){
	this.state = state;
	this.registry = new Object();
	this.reflist = new Array();
	this.namereg = new CSL.Factory.Registry.NameReg(state);
	//
	// shared scratch vars
	this.mylist = new Array();
	this.myhash = new Object();
	this.deletes = new Array();
	this.inserts = new Array();
	this.dbupdates = new Object();
	//
	// each ambig is a list of the ids of other objects
	// that have the same base-level rendering
	this.ambigs = new Object();
	this.start = false;
	this.end = false;
	this.initialized = false;
	this.skip = false;
	this.maxlength = 0;


	this._make_sort_deletes = function(deletes){
		return function(a,b){
			if (deletes.indexOf(a.id) > -1){
				return -1;
			} else if (deletes.indexOf(b.id) > -1){
				return 1;
			};
			return 0;
		};
	};

	//
	// XXXXX: This could be a problem.  May not work to feed a method of
	// this object to Array.sort().
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

//
// Here's the sequence of operations to be performed on
// update:
//
//  1. (o) [init] Receive list as function argument.
//  2. (o) [init] Initialize delete and insert hash stores with items that have changed
//         in the DB.

//  3. (o) [getdeletes] Identify items for deletion, add to deletes list.
//  4. (o) [getinserts] Identify items for explicit insertion, add to inserts list.

//  5. (o) [delnames] Delete names in items to be deleted from names reg, and obtain IDs
//         of other items that would be affected by changes around that surname.
//  6. (o) [delnames] Complement delete and insert lists with items affected by
//         possible name changes.
//  7. (o) [delambigs] Delete all items to be deleted from their disambig pools.
//  8. (o) [dellist] Delete all items in deletion list from registry list.
//         Do this with a sort-and-slice, applying a sort function like that described
//         under step 17, below.
//  9. (o) [delhash] Delete all items in deletion list from hash.

// 10. (o) Retrieve entries for items to insert.
// 11. (o) Add items to be inserted to their disambig pools.
// 12. (o) Add names in items to be inserted to names reg (implicit in getAmbiguousCite).
// 13. (o) Create registry token for each item to be inserted.
// 14. (o) Set sort keys on each item token. (seems to be okay, but watch this: too early?)
// 15. (o) Add items for insert to hash.
// 16. ( ) Set disambiguation parameters on each item token.

// 17. ( ) Create "new" list of hash pointers ... append items to the list,
//         and then apply a bespoke sort function that forces items into the order of
//         the received list.  Here's a sort function that will do that:
//
//     var sortme = function(a,b){
//         if(origlist.indexOf(a) < origlist.indexOf(b)){
//             return -1
//         } else{
//             return 1
//         }
//     }
//
//     var origlist = ["Item1","Item2"]
//
//     Usage: newlist.sort(sortme)
//     (where newlist has the same elements as origlist, but possibly in a different order)
//

// 18. ( ) Apply citation numbers to new list.
// 19. ( ) Rerun disambiguation once for each affected disambig pool.
// 20. ( ) Reset sort keys stored in items
// 21. ( ) Resort list
// 22. ( ) Reset citation numbers on list items
//

CSL.Factory.Registry.prototype.init = function(myitems){
	//  1. Receive list as function argument.
	this.mylist = myitems;
	this.myhash = new Object();
	for each (var item in myitems){
		this.myhash[item] = true;
	};
	//
	//  2. Initialize delete and insert hash stores with items that have changed
	//    in the DB.
	this.deletes = new Object();
	this.inserts = new Object();
	for (var item in this.dbupdates){
		this.deletes[item] = true;
		this.inserts[item] = true;
	};
};

CSL.Factory.Registry.prototype.getdeletes = function(){
	//
	//  3. Identify items for deletion, add to deletes list.
	//
	for (var item in this.registry){
		if (!this.myhash[item]){
			this.deletes[item] = true;
		};
	};
};

CSL.Factory.Registry.prototype.getinserts = function(){
	//
	//  4. Identify items for explicit insertion, add to inserts list.
	//
	for (var item in this.myhash){
		if (!this.registry[item]){
			this.inserts[item] = true;
		};
	};
};

CSL.Factory.Registry.prototype.delnames = function(){
	//
	//  5. Delete names in items to be deleted from names reg, and obtain IDs
	//     of other items that would be affected by changes around that surname.
	//
	for (var item in this.deletes){
		var otheritems = this.namereg.delitems(this.deletes);
		//
		//  6. Complement delete and insert lists with items affected by
		//     possible name changes.
		//
		for (var i in otheritems){
			this.deletes[i] = true;
		};
		for (var i in otheritems){
			this.inserts[i] = true;
		};
	};
};

CSL.Factory.Registry.prototype.delambigs = function(){
	//
	//  7. Delete all items to be deleted from their disambig pools.
	//
	for (var item in this.deletes){
		var ambig = this.registry[item].ambig;
		var pos = this.ambigs[ambig].indexOf(item);
		if (pos > -1){
			var items = this.ambigs[ambig].slice();
			this.ambigs[ambig] = items.slice(0,pos).concat(items.slice([pos+1],items.length));
		}
	};
};

CSL.Factory.Registry.prototype.dellist = function(){
	//
	//  8. Delete all items in deletion list from registry list.
	//     Do this with a sort-and-slice, applying a sort function like that described
	//     under step 14, below.
	//
	var deletes = this.deletes;
	var _sort_deletes = this._make_sort_deletes(this.deletes);
	this.reflist.sort(_sort_deletes);
	this.reflist = this.reflist.slice(deletes.length);
};

CSL.Factory.Registry.prototype.delhash = function(){
	//
	//  9. Delete all items in deletion list from hash.
	//
	for (var item in this.deletes){
		delete this.registry[item];
	};
};

CSL.Factory.Registry.prototype.getitems = function(){
	//
	// 10. Retrieve entries for items to insert.
	//
	for (var item in this.inserts){
		var Item = this.state.retrieveItem(item);
		//
		// 11. Add items to be inserted to their disambig pools.
		//
		var akey = this.state.getAmbiguousCite(Item);
		var abase = this.state.getAmbigConfig();
		var modes = this.state.getModes();

		if (!this.ambigs[akey]){
			this.ambigs[akey] = new Array();
		};
		if (this.ambigs[akey].indexOf(item) == -1){
			this.ambigs[akey].push(item);
		};
		//
		// 12. Add names in items to be inserted to names reg (implicit in getAmbiguousCite).
		//
		// 13. Create registry token for each item to be inserted.
		//
		var newitem = {
			"id":item,
			"seq":0,
			"sortkeys":undefined,
			"disambig":undefined
		};
		//
		// 15. Set sort keys on each item token. (seems to be okay, but watch this: too early?)
		//
		newitem.sortkeys = state.getSortKeys(Item,"bibliography_sort");
		//
		// 16. Add items for insert to hash.
		//
		this.registry[item] = newitem;
	};
};

//
// The following will disappear, but we'll use some of its pieces in the new version.
//

CSL.Factory.Registry.prototype.insert = function(state,Item){

	if (this.registry[Item.id]){
		return;
	}
	var sortkeys = state.getSortKeys(Item,"bibliography_sort");
	var akey = state.getAmbiguousCite(Item);
	var abase = state.getAmbigConfig();
	var modes = state.getModes();
	//
	// register the notional ambiguation config
	this.registerAmbigToken(state,akey,Item.id,abase);

	//
	// registryItem instantiates an object with a copy of the
	// sort key, and a list shared with
	// disambiguation partners, if any, maintained
	// in sort key order.
	// (after this, we're ready to roll for the insert)
	var newitem = {
		"id":Item.id,
		"seq":1,
		"dseq":0,
		"sortkeys":sortkeys,
		"disambig":abase
	};


	// register the notional ambiguation config
	this.registerAmbigToken(state,akey,Item.id,abase);
	//
	// if there are multiple ambigs, disambiguate them
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
	//
	// for anything left over, set disambiguate to true, and
	// try again from the base.
	if (leftovers && leftovers.length && state.opt.has_disambiguate){
		var leftovers = this.disambiguateCites(state,akey,modes,leftovers);
	}

	if ( leftovers && leftovers.length && state[state.tmp.area].opt["disambiguate-add-year-suffix"]){
		for (var i in leftovers){
			this.registry[ leftovers[i].id ].disambig[2] = i;
		}
	}
	if (this.debug) {
		print("---> End of registry cleanup");
	}
};

/**
 * Compare two sort keys
 * <p>Nested, because keys are an array.</p>
 */
CSL.Factory.Registry.Comparifier = function(state,keyset){
	var sort_directions = state[keyset].opt.sort_directions.slice();
    this.compareKeys = function(a,b){
		for (var i=0; i < a.length; i++){
			//
			// for ascending sort 1 uses 1, -1 uses -1.
			// For descending sort, the values are reversed.
			//
			// XXXXX
			//
			// Need to handle undefined values.  No way around it.
			// So have to screen .localeCompare (which is also
			// needed) from undefined values.  Everywhere, in all
			// compares.
			//
			var cmp = 0;
			if ( !a[i].length || !b[i].length ){
				if (a[i] < b[i]){
					cmp = -1;
				} else if (a[i] > b[i]){
					cmp = 1;
				}
			} else {
				cmp = a[i].toLocaleLowerCase().localeCompare(b[i].toLocaleLowerCase());
			}
			if (0 < cmp){
				return sort_directions[i][1];
			} else if (0 > cmp){
				return sort_directions[i][0];
			}
		}
		return 0;
	};
};


/**
 * Compare two disambiguation tokens by their registry sort order
 * <p>Disambiguation lists need to be sorted this way, to
 * obtain the correct year-suffix when that's used.</p>
 */
CSL.Factory.Registry.prototype.compareRegistryTokens = function(a,b){
	if (a.seq > b.seq){
		return 1;
	} else if (a.seq < b.seq){
		return -1;
	}
	return 0;
};
