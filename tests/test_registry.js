dojo.provide("tests.test_registry");

doh.register("tests.registry", [
	function testRegistrationSortWithSingleKey(){
		var xml = "<style>"
				  + "<citation>"
					  + "<layout>"
						  + "<text variable=\"title\"/>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<sort>"
						  + "<key variable=\"title\"/>"
					  + "</sort>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1","simple-western-name-2","simple-western-name-3"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		style.registry.insert(style,input[0]);
		//print(style.registry.registry["simple-western-name-2"].sortkeys);
		doh.assertEqual( "simple-western-name-1", style.registry.registry["simple-western-name-2"].next );
		doh.assertEqual( "simple-western-name-2", style.registry.registry["simple-western-name-1"].prev );
		doh.assertEqual( false, style.registry.registry["simple-western-name-2"].prev );
		doh.assertEqual( false, style.registry.registry["simple-western-name-1"].next );
	},
	function testGetSortKeyMacro(){
		var xml = "<style>"
				  + "<macro name=\"mymac\">"
					  + "<text value=\"My Macro Text\"/>"
					  + "<text value=\"AAA\" prefix=\"::\" font-style=\"italic\"/>"
				  + "</macro>"
				  + "<bibliography>"
				  + "<sort>"
					  + "<key macro=\"mymac\"/>"
				  + "</sort>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1"]);
		var res = style.getSortKeys(input[0],"bibliography_sort");
		doh.assertEqual("My Macro Text::AAA", res[0]);
	},
	function testMaxNamesDetection(){
		var xml = "<style>"
				  + "<citation>"
					  + "<layout>"
						  + "<names variable=\"author editor\">"
							  + "<name/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<layout>"
						  + "<sort>"
							  + "<key variable=\"title\"/>"
						  + "</sort>"
					  + "</layout>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["seven-names-plus-two-1"]);
		var ambig = style.getAmbiguousCite(input[0]);
		doh.assertEqual(7,style.tmp.names_max.mystack[0]);
	},
	function testGetSortKeyVariable(){
		var xml = "<bibliography><sort><key variable=\"title\"/></sort></bibliography>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1"]);
		var res = style.getSortKeys(input[0],"bibliography_sort");
		doh.assertEqual("His Anonymous Life", res[0]);
	},
	function testDisambiguateAddGivensInternals(){
		var xml = "<style>"
				  + "<macro name=\"year\">"
					  + "<date variable=\"issued\">"
						  + "<date-part name=\"year\"/>"
					  + "</date>"
				  + "</macro>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"4\"/>"
				  + "<option name=\"et-al-use-first\" value=\"2\"/>"
    				  + "<layout>"
						  + "<names variable=\"author editor\">"
							  + "<name delimiter=\", \" initialize-with=\".\"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<layout>"
						  + "<sort>"
						  + "<key macro=\"year\"/>"
						  + "</sort>"
					  + "</layout>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-1","ambigs-2","ambigs-6"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		style.registry.insert(style,input[2]);
		style.getAmbiguousCite(input[0]);
		var res = style.getAmbigConfig();
		doh.assertEqual({"names":[6],"givens":[[1,1,1,1,1,1]],"year_suffix":false,"disambiguate":false},res);

	},

	function testConfigureNumberOfNames(){
		var xml = "<style>"
				  + "<macro name=\"year\">"
					  + "<date variable=\"issued\">"
						  + "<date-part name=\"year\"/>"
					  + "</date>"
				  + "</macro>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"4\"/>"
				  + "<option name=\"et-al-use-first\" value=\"2\"/>"
    				  + "<layout>"
						  + "<names variable=\"author editor\">"
							  + "<name delimiter=\", \"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<layout>"
						  + "<sort>"
						  + "<key macro=\"year\"/>"
						  + "</sort>"
					  + "</layout>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-2"]);
		var disambig = {"names":[3],"givens":[[2,2,2]],"year_suffix":false,"disambiguate":false};
		var res = style.getAmbiguousCite(input[0],disambig);
		doh.assertEqual("Albert Asthma, Bosworth Bronchitis, Crispin Cold, et al.",res);
	},
	function testRegistration(){
		var xml = "<style>"
				  + "<citation>"
					  + "<text variable=\"title\"/>"
				  + "</citation>"
				  + "<bibliography>"
				  + "<sort>"
					  + "<key variable=\"title\"/>"
				  + "</sort>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1","simple-western-name-2","simple-western-name-3"]);
		style.registry.insert(style,input[0]);
		doh.assertTrue( style.registry.registry["simple-western-name-1"] );
	},
	function testRegistrationContent(){
		var xml = "<style>"
				  + "<citation>"
					  + "<text variable=\"title\"/>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<sort>"
						  + "<key variable=\"title\"/>"
					  + "</sort>"
				  + "</bibliography>"
			+ "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1","simple-western-name-2","simple-western-name-3"]);
		style.registry.insert(style,input[0]);
		var res = style.registry.registry["simple-western-name-1"];
		doh.assertEqual( "simple-western-name-1", res.id );
		doh.assertEqual( "His Anonymous Life", res.sortkeys );
	},
	function testDisabiguationGetDefaultVals(){
		var xml = "<style>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"4\"/>"
				  + "<option name=\"et-al-use-first\" value=\"2\"/>"
    				  + "<layout>"
						  + "<names variable=\"author editor\">"
							  + "<name delimiter=\", \"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-1"]);
		var res = style.getAmbiguousCite(input[0]);
		doh.assertEqual(2,style.getAmbigConfig()["givens"][0][0]);
		doh.assertEqual(2,style.getAmbigConfig()["givens"][0][1]);
	},
	function testDisambiguationGivens(){
		var xml = "<style>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"disambiguate-add-givenname\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"3\"/>"
				  + "<option name=\"et-al-use-first\" value=\"1\"/>"
    				  + "<layout>"
						  + "<names variable=\"author\">"
							  + "<name delimiter=\", \"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-4","ambigs-5"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		style.getAmbiguousCite(input[0]);
		doh.assertEqual(1 ,style.registry.registry["ambigs-4"].disambig["givens"].length);
	},





	function testDisambiguateAddGivensSimpleWithInitials(){
		var xml = "<style>"
				  + "<citation>"
					  + "<option name=\"disambiguate-add-givenname\" value=\"true\"/>"
    				  + "<layout>"
						  + "<names variable=\"author\">"
							  + "<name delimiter=\", \" initialize-with=\".\"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-7","ambigs-8"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		var res = style.getAmbiguousCite(input[0]);
		doh.assertEqual("J. Doe, Janet Roe",res);
	},
	function testDisambiguateAddNamesSimple(){
		var xml = "<style>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"2\"/>"
				  + "<option name=\"et-al-use-first\" value=\"1\"/>"
    				  + "<layout>"
						  + "<names variable=\"author\">"
							  + "<name delimiter=\", \"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-9","ambigs-10"]);
		//print("input[0] (ambigs-9) ================= ");
		style.registry.insert(style,input[0]);
		//print("input[1] (ambigs-10) =================");
		style.registry.insert(style,input[1]);
		//print("end =================");
		var res0 = style.getAmbiguousCite(input[0]);
		doh.assertEqual("John Doe, Jane Roe",res0);
		//print("t0 passed");
	},
	function testGetUndecoratedCite(){
		var xml = "<text value=\"hello\" font-style=\"italic\"/>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var res = style.getAmbiguousCite([{}]);
		doh.assertEqual("hello", res);
	},
	function testInstantiation(){
		var state = new CSL.Factory.State();
		var obj = new CSL.Factory.Registry(state);
		doh.assertTrue(obj);
	},
	function testDisambiguateAddGivensSimple(){
		var xml = "<style>"
				  + "<citation>"
					  + "<option name=\"disambiguate-add-givenname\" value=\"true\"/>"
    				  + "<layout>"
						  + "<names variable=\"author\">"
							  + "<name delimiter=\", \" initialize-with=\".\"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-7","ambigs-8"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		var res = style.getAmbiguousCite(input[0]);
		doh.assertEqual("J. Doe, Janet Roe",res);
	},
	function testMultipleRegistration(){
		var xml = "<style>"
				  + "<citation>"
					  + "<text variable=\"title\"/>"
				  + "</citation>"
				  + "<bibliography>"
				  + "<sort>"
					  + "<key variable=\"title\"/>"
				  + "</sort>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1","simple-western-name-2","simple-western-name-3"]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		style.registry.insert(style,input[0]);
		doh.assertTrue( style.registry.registry["simple-western-name-1"] );
		doh.assertTrue( style.registry.registry["simple-western-name-2"] );
	},
	function testAmbiguityDetection(){
		var xml = "<style>"
				  + "<citation>"
				  + "<layout>"
					  + "<text variable=\"title\"/>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
				  + "<sort>"
					  + "<key variable=\"title\"/>"
				  + "</sort>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["simple-western-name-1","simple-western-name-2","simple-western-name-3"]);
		var akey = style.getAmbiguousCite(input[0]);
		style.registry.insert(style,input[0]);
		style.registry.insert(style,input[1]);
		style.registry.insert(style,input[2]);
		doh.assertEqual(2, style.registry.ambigs[akey].length);
	},
	function testDisambiguateAddNamesComplicated(){
		var xml = "<style>"
				  + "<macro name=\"year\">"
					  + "<date variable=\"issued\">"
						  + "<date-part name=\"year\"/>"
					  + "</date>"
				  + "</macro>"
				  + "<citation>"
				  + "<option name=\"disambiguate-add-names\" value=\"true\"/>"
				  + "<option name=\"et-al-min\" value=\"4\"/>"
				  + "<option name=\"et-al-use-first\" value=\"2\"/>"
    				  + "<layout>"
						  + "<names variable=\"author editor\">"
							  + "<name delimiter=\", \"/>"
						  + "</names>"
					  + "</layout>"
				  + "</citation>"
				  + "<bibliography>"
					  + "<layout>"
						  + "<sort>"
						  + "<key macro=\"year\"/>"
						  + "</sort>"
					  + "</layout>"
				  + "</bibliography>"
				  + "</style>";
		var builder = new CSL.Core.Build(xml);
		var raw = builder.build();
		var configurator = new CSL.Core.Configure(raw);
		var style = configurator.configure();
		var getter = new CSL.System.Retrieval.GetInput();
		var input = getter.getInput(["ambigs-1","ambigs-2","ambigs-3"]);
		//print("input[0] (ambigs-1) =================");
		style.registry.insert(style,input[0]);
		//print("input[1] (ambigs-2) =================");
		style.registry.insert(style,input[1]);
		//print("input[2] (ambigs-3) =================");
		style.registry.insert(style,input[2]);
		//print("end =================");
		var res0 = style.getAmbiguousCite(input[0]);
		var res1 = style.getAmbiguousCite(input[1]);
		var res2 = style.getAmbiguousCite(input[2]);
		doh.assertEqual("Albert Asthma, Bosworth Bronchitis, Crispin Cold, David Dropsy, Elvin Ebola, Fergus Fever",res0);
		//print("t0 passed");
		doh.assertEqual("Albert Asthma, Bosworth Bronchitis, Crispin Cold, David Dropsy, Ernie Enteritis, et al.",res1);
		//print("t1 passed");
		doh.assertEqual("Albert Asthma, Bosworth Bronchitis, Crispin Cold, David Dropsy, Elvin Ebola, Fergus Fever",res2);
		//print("t2 passed");
	},


]);
