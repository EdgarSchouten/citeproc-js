/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights
 * Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Affero General Public License (the [AGPLv3]
 * License), in which case the provisions of [AGPLv3] License are
 * applicable instead of those above. If you wish to allow use of your
 * version of this file only under the terms of the [AGPLv3] License
 * and not to allow others to use your version of this file under the
 * CPAL, indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by the
 * [AGPLv3] License. If you do not delete the provisions above, a
 * recipient may use your version of this file under either the CPAL
 * or the [AGPLv3] License.”
 */

dojo.provide("citeproc_js.restore");

var Xmycsl = "<style>"
	  + "<citation disambiguate-add-givenname=\"true\">"
	  + "  <sort>"
	  + "    <key variable=\"title\"/>"
	  + "  </sort>"
	  + "  <layout delimiter=\"; \" prefix=\"(\" suffix=\")\">"
	  + "    <names variable=\"author\">"
	  + "    <name form=\"short\" initialize-with=\". \"/>"
	  + "    </names>"
	  + "    <date variable=\"issued\" form=\"text\" date-parts=\"year\" prefix=\" \"/>"
	  + "  </layout>"
	  + "</citation>"
	+ "</style>";

var XITEM1 = {
	"id": "ITEM-1",
	"type": "book",
	"title": "Book B",
	"author": [
		{
			"family": "Doe",
			"given": "John"
		}
	]
};

var XITEM2 = {
	"id": "ITEM-2",
	"type": "book",
	"title": "Book A",
	"author": [
		{
			"family": "Roe",
			"given": "Jane"
		}
	]
};

var XITEM3 = {
	"id": "ITEM-3",
	"type": "book",
	"title": "Book C",
	"author": [
		{
			"family": "Doe",
			"given": "Richard"
		}
	]
};


var XCITATION1 = {
	"citationID": "CITATION-1",
	"citationItems": [
		{
			"id": "ITEM-1"
		},
		{
			"id": "ITEM-2"
		}
	],
	"properties": {
		"index": 0,
		"noteIndex": 1
	}
};

var XCITATION1x = {
	"citationID": "CITATION-1",
	"citationItems": [
		{
			"id": "ITEM-1",
			"position": 0,
			"sortkeys": ["Book B"]
		},
		{
			"id": "ITEM-2",
			"position": 0,
			"sortkeys": [["Book A"]]
		}
	],
	"properties": {
		"index": 0,
		"noteIndex": 1
	}
};

var XCITATION2 = {
	"citationID": "CITATION-2",
	"citationItems": [
		{
			"id": "ITEM-2"
		}
	],
	"properties": {
		"index": 1,
		"noteIndex": 2
	}
};

var XCITATION2x = {
	"citationID": "CITATION-2",
	"citationItems": [
		{
			"id": "ITEM-2",
			"position": 0,
			"sortkeys": [["Book A"]]
		}
	],
	"properties": {
		"index": 1,
		"noteIndex": 2
	}
};

var XCITATION3 = {
	"citationID": "CITATION-3",
	"citationItems": [
		{
			"id": "ITEM-3"
		}
	],
	"properties": {
		"index": 2,
		"noteIndex": 3
	}
};

doh.register("citeproc_js.restore", [
	function testInstantiation() {
		function testme () {
			if ("undefined" == typeof Item){
				Item = {"id": "Item-1"};
			}
			try {
				var sys = new RhinoTest();
				var style = new CSL.Engine(sys,Xmycsl);
				return "Success";
			} catch (e) {
				return "Failure";
			}
		}
		var res = testme();
		doh.assertEqual( "Success", res );
	},
	function testThatItWorksAtAll() {
		function testme () {
			var sys, style, res1, res2, data;
			sys = new RhinoTest([XITEM1, XITEM2]);
			style = new CSL.Engine(sys,mycsl);
			try {
				[data, res1] = style.processCitationCluster(XCITATION1, [], []);
				[data, res2] = style.processCitationCluster(XCITATION2, [], []);
				style.restoreProcessorState([XCITATION1x, XCITATION2x]);
				return "Success";
			} catch (e) {
				return e;
			}
		}
		doh.assertEqual("Success", testme());
	},
	function testThatItWorksAtAll() {
		var sys, style, res1, res2, res3, data;
		sys = new RhinoTest([XITEM1, XITEM2, XITEM3]);
		style = new CSL.Engine(sys,Xmycsl);
		[data, res1] = style.processCitationCluster(XCITATION1, [], []);
		[data, res2] = style.processCitationCluster(XCITATION2, [["CITATION-1", 1]], []);
		style.restoreProcessorState([XCITATION1x, XCITATION2x]);
		[data, res3] = style.processCitationCluster(XCITATION3, [["CITATION-1", 1],["CITATION-2", 2]], []);
		doh.assertEqual(2, res3.length);
		doh.assertEqual(0, res3[0][0]);
		doh.assertEqual("(Roe; J. Doe)", res3[0][1]);
	}
]);
