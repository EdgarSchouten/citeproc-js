/**
 * A Javascript implementation of the CSL citation formatting language.
 *
 * <p>A configured instance of the process is built in two stages,
 * using {@link CSL.Core.Build} and {@link CSL.Core.Configure}.
 * The former sets up hash-accessible locale data and imports the CSL format file
 * to be applied to the citations,
 * transforming it into a one-dimensional token list, and
 * registering functions and parameters on each token as appropriate.
 * The latter sets jump-point information
 * on tokens that constitute potential branch
 * points, in a single back-to-front scan of the token list.
 * This
 * yields a token list that can be executed front-to-back by
 * body methods available on the
 * {@link CSL.Engine} class.</p>
 *
 * <p>This top-level {@link CSL} object itself carries
 * constants that are needed during processing.</p>
 * @namespace A CSL citation formatter.
 */
CSL.Util.substituteStart = function(state,target){
	//
	// Contains body code for both substitute and first-field/remaining-fields
	// formatting.
	//
	if (("text" == this.name && !this.postponed_macro) || ["number","date","names"].indexOf(this.name) > -1){
		var element_trace = function(state,Item,item){
			if (state.tmp.element_trace.value() == "author" || "names" == this.name){
				if (item && item["author-only"]){
					state.tmp.element_trace.push("do-not-suppress-me");
				} else if (item && item["suppress-author"]){
					state.tmp.element_trace.push("suppress-me");
				};
			} else {
				if (item && item["author-only"]){
					state.tmp.element_trace.push("suppress-me");
				} else if (item && item["suppress-author"]){
					state.tmp.element_trace.push("do-not-suppress-me");
				};
			};
		};
		this.execs.push(element_trace);
	};
	if (state.build.area == "bibliography"){
		if (state.build.render_nesting_level == 0){
			//
			// The markup formerly known as @bibliography/first
			//
			if (state.bibliography.opt["second-field-align"]){
				var bib_first = new CSL.Token("group",CSL.START);
				bib_first.decorations = [["@display","left-margin"]];
				var func = function(state,Item){
					if (!state.tmp.render_seen){
						state.tmp.count_offset_characters = true;
						state.output.startTag("bib_first",bib_first);
					};
				};
				bib_first.execs.push(func);
				target.push(bib_first);
			};
			if ("csl-left-label" == this.strings.cls && "bibliography" == state.build.area){
				print("OOOOOOOOOOOOOOOOOOKAY!");
				var func = function(state,Item){
					if ("csl-left-label" == this.strings.cls && !state.tmp.suppress_decorations){
						state.tmp.count_offset_characters = true;
					};
				};
				this.execs.push(func);
			}
		}
		state.build.render_nesting_level += 1;
	}
	if (state.build.substitute_level.value() == 1){
		//
		// All top-level elements in a substitute environment get
		// wrapped in conditionals.  The substitute_level variable
		// is a stack, because spanned names elements (with their
		// own substitute environments) can be nested inside
		// a substitute environment.
		//
		// (okay, we use conditionals a lot more than that.
		// we slot them in for author-only as well...)
		var choose_start = new CSL.Token("choose",CSL.START);
		target.push(choose_start);
		var if_start = new CSL.Token("if",CSL.START);
		//
		// Set a test of the shadow if token to skip this
		// macro if we have acquired a name value.
		var check_for_variable = function(state,Item){
			if (state.tmp.can_substitute.value()){
				return true;
			}
			return false;
		};
		if_start.tests.push(check_for_variable);
		//
		// this is cut-and-paste of the "any" evaluator
		// function, from Attributes.  These functions
		// should be defined in a namespace for reuse.
		// Sometime.
		if_start.evaluator = state.fun.match.any;
		target.push(if_start);
	};
};


CSL.Util.substituteEnd = function(state,target){
	if (state.build.area == "bibliography"){
		state.build.render_nesting_level += -1;
		if (state.build.render_nesting_level == 0){
			if ("csl-left-label" == this.strings.cls && state.build.area == "bibliography"){
				var func = function(state,Item){
					if ("csl-left-label" == this.strings.cls && !state.tmp.suppress_decorations){
						state.tmp.count_offset_characters = false;
					};
				};
				this.execs.push(func);
			};
			if (state.bibliography.opt["second-field-align"]){
				var bib_first_end = new CSL.Token("group",CSL.END);
				var first_func_end = function(state,Item){
					if (!state.tmp.render_seen){
						state.output.endTag(); // closes bib_first
						state.tmp.count_offset_characters = false;
					};
				};
				bib_first_end.execs.push(first_func_end);
				target.push(bib_first_end);
				var bib_other = new CSL.Token("group",CSL.START);
				bib_other.decorations = [["@display","right-inline"]];
				var other_func = function(state,Item){
					if (!state.tmp.render_seen){
						state.tmp.render_seen = true;
						state.output.startTag("bib_other",bib_other);
					};
				};
				bib_other.execs.push(other_func);
				target.push(bib_other);
			};
		};
	};
//	if (state.build.substitute_level.value() <= 1 && this.name != "group"){
	if (state.build.substitute_level.value() == 1){
		var if_end = new CSL.Token("if",CSL.END);
		target.push(if_end);
		var choose_end = new CSL.Token("choose",CSL.END);
		target.push(choose_end);
	};

	var toplevel = "names" == this.name && state.build.substitute_level.value() == 0;
	var hasval = "string" == typeof state[state.build.area].opt["subsequent-author-substitute"];
	if (toplevel && hasval){
		var author_substitute = new CSL.Token("text",CSL.SINGLETON);
		var func = function(state,Item){
			var printing = !state.tmp.suppress_decorations;
			if (printing){
				if (!state.tmp.rendered_name){
					state.tmp.rendered_name = state.output.string(state,state.tmp.name_node.blobs,false);
					if (state.tmp.rendered_name){
						//CSL.debug("TRY! "+state.tmp.rendered_name);
						if (state.tmp.rendered_name == state.tmp.last_rendered_name){
							var str = new CSL.Blob(false,state[state.tmp.area].opt["subsequent-author-substitute"]);
							state.tmp.name_node.blobs = [str];
						};
						state.tmp.last_rendered_name = state.tmp.rendered_name;
					};
				};
			};
		};
		author_substitute.execs.push(func);
		target.push(author_substitute);
	};

	if (("text" == this.name && !this.postponed_macro) || ["number","date","names"].indexOf(this.name) > -1){
		var element_trace = function(state,Item){
			state.tmp.element_trace.pop();
		};
		this.execs.push(element_trace);
	}
};
