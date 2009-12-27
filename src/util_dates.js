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
if (!CSL) {
	load("./src/csl.js");
}

/**
 * Date mangling functions.
 * @namespace Date construction utilities
 */
CSL.Util.Dates = new function(){};

/**
 * Year manglers
 * <p>short, long</p>
 */
CSL.Util.Dates.year = new function(){};

/**
 * Convert year to long form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.year["long"] = function(state,num){
	if (!num){
		num = 0;
	}
	return num.toString();
}

/**
 * Convert year to short form
 * <p>Just crops any 4-digit year to the last two digits.</p>
 */
CSL.Util.Dates.year["short"] = function(state,num){
	num = num.toString();
	if (num && num.length == 4){
		return num.substr(2);
	}
}


/*
 * MONTH manglers
 * long, short, numeric, numeric-leading-zeros
 */
CSL.Util.Dates["month"] = new function(){};

/**
 * Convert month to numeric form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.month["numeric"] = function(state,num){
	var ret = num.toString();
	return ret;
}

/**
 * Convert month to numeric-leading-zeros form
 * <p>This just passes the number back as string padded with zeros.</p>
 */
CSL.Util.Dates.month["numeric-leading-zeros"] = function(state,num){
	if (!num){
		num = 0;
	}
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	return num.toString();
}

/**
 * Convert month to long form
 * <p>This passes back the month of the locale in long form.</p>
 */
CSL.Util.Dates.month["long"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	num = "month-"+num;
	return state.getTerm(num,"long",0);
}

/**
 * Convert month to long form
 * <p>This passes back the month of the locale in short form.</p>
 */
CSL.Util.Dates.month["short"] = function(state,num){
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	num = "month-"+num;
	return state.getTerm(num,"short",0);
}


/*
 * DAY manglers
 * numeric, numeric-leading-zeros, ordinal
 */
CSL.Util.Dates["day"] = new function(){};

/**
 * Convert day to numeric form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.day["numeric"] = function(state,num){
	return num.toString();
}
CSL.Util.Dates.day["long"] = CSL.Util.Dates.day["numeric"];

/**
 * Convert day to numeric-leading-zeros form
 * <p>This just passes the number back as a string padded with zeros.</p>
 */
CSL.Util.Dates.day["numeric-leading-zeros"] = function(state,num){
	if (!num){
		num = 0;
	}
	num = num.toString();
	while (num.length < 2){
		num = "0"+num;
	}
	return num.toString();
}

/**
 * Convert day to ordinal form
 * <p>This will one day pass back the number as a string with the
 * ordinal suffix appropriate to the locale.  For the present,
 * it just does what is most of the time right for English.</p>
 */
CSL.Util.Dates.day["ordinal"] = function(state,num){
	return state.fun.ordinalizer(num);
}
