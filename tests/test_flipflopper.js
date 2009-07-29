dojo.provide("tests.test_flipflopper");

doh.register("tests.flipflopper", [
	function testGetOneEscapee(){
		var ff = new CSL.Util.FlipFlopper();
		ff.init("hello\\Xhello");
		ff.getEscapees();
		doh.assertEqual(1, ff.escapees.length);
		doh.assertEqual(5, ff.escapees[0]);
		doh.assertEqual("helloXhello",ff.str);
	},
	function testGetTwoEscapees(){
		var ff = new CSL.Util.FlipFlopper();
		ff.init("hello\\Xhello\\Yagain");
		ff.getEscapees();
		doh.assertEqual(2, ff.escapees.length);
		doh.assertEqual(5, ff.escapees[0]);
		doh.assertEqual(11, ff.escapees[1]);
		doh.assertEqual("helloXhelloYagain",ff.str);
	},
	function testProcessTags(){
		var ff = new CSL.Util.FlipFlopper();
		ff.init("hello <i>italic <b>bold+italic</b> YY </i>italic \"quote <b>XX\"hello</b>ZZ");
		ff.getEscapees();
		ff.processTags();
		doh.assertEqual(6,ff.blob.blobs.length);
		doh.assertEqual("ZZ",ff.blob.blobs[5].blobs);
		doh.assertEqual("hello</b>",ff.blob.blobs[4].blobs);
		//
		// i.e. [<blob.blobs:"italic ">,<blob>,<blob.blobs:" YY ">]
		//
		doh.assertEqual(3, ff.blob.blobs[1].blobs.length);
	}
]);
