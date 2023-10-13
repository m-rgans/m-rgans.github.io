/*

	The links array, used to define connections between elements

	self: The element that, when clicked, will highlight itself and the targets
	targets: the elements to be highlighted.
	bidirectional: Should clicking any of the targets also highlight the source?

*/

const links = 
[
	{
		self : "A1_ref",
		targets : ["A1"],
		bidirectional : true,
	},
	{
		self : "B13_ref",
		targets : ["B13"],
		bidirectional : true,
	},
	{
		self : "D12_ref",
		targets : ["D12"],
		bidirectional : true,
	},
	{
		self : "B13_2_ref",
		targets : ["B13"],
		bidirectional : true,
	},
	{
		self : "A3_ref",
		targets : ["A3"],
		bidirectional : true,
	},
	//==============================================
	{
		self : "D4_ref",
		targets : ["D4"],
		bidirectional : true,
	},
	{
		self : "B9_ref",
		targets : ["B9"],
		bidirectional : true,
	},
	{
		self : "E3_ref",
		targets : ["E3"],
		bidirectional : true,
	},
	{
		self : "D8_ref",
		targets : ["D8"],
		bidirectional : true,
	},
	{
		self : "A14_ref",
		targets : ["A14"],
		bidirectional : true,
	},
	//==============================================
	{
		self : "D8C3_ref",
		targets : ["D8", "C3"],
		bidirectional : true,
	},
	{
		self : "Row4_ref",
		targets : ["A4", "B4", "C4", "D4", "E4", "Row4"],
		bidirectional : true,
	},
	{
		self : "Row4",
		targets : ["A4", "B4", "C4", "D4", "E4"],
		bidirectional : false,
	},
	{
		self : "A_ref",
		targets : ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","A15","ColumnA"],
		bidirectional : true,
	},
	{
		self : "ColumnA",
		targets : ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","A15"],
		bidirectional : false,
	},
	{
		self : "D12_ref2",
		targets : ["D12"],
		bidirectional : true,
	},
	{
		self : "A8_ref",
		targets : ["A8"],
		bidirectional : true,
	},
	//==============================================
	{
		self : "C15_ref",
		targets : ["C15"],
		bidirectional : true,
	},
	{
		self : "E13_ref",
		targets : ["E13"],
		bidirectional : true,
	},
	{
		self : "C11_ref",
		targets : ["C11"],
		bidirectional : true,
	},
	{
		self : "C12_ref",
		targets : ["C12"],
		bidirectional : true,
	},
	{
		self : "C5_ref",
		targets : ["C5"],
		bidirectional : true,
	},
];

const HIGHLIGHT_COLOR = "blue";

//maps element ids to a group of ids to highlight
var link_groups = []

// The link group currently highlighted, or null if there is none
var active_link_group;

/* 

	Sets the active link group
	group_id: string, id of the element whose link group to activate

*/
function set_active_link_group(group_id) {
	if (active_link_group != null) {
		set_link_group_active(active_link_group, false);
	}
	set_link_group_active(group_id, true);
	active_link_group = group_id;
}

/* 

	Activates or deactivates a link group
	group_id (String): string, id of the element whose link group in question
	active_bool (Boolean): state to set the link group to

*/
function set_link_group_active(group_id, active_bool) {
	if (!group_id in link_groups) {
		console.error("Tried to set active on nonexistant link group '" + group_id + "'.");
		return;
	}

	for (i in link_groups[group_id]) {
		let target_id = link_groups[group_id][i];
		obj = document.getElementById(target_id);

		if (obj == null) {
			console.error("Group '" + group_id + "' has invalid link to '" + target_id + "'.");
			continue;
		}

		if (active_bool) {
			// set highlight
			obj.style.color = HIGHLIGHT_COLOR;
		}
		else {
			// clear highlight
			obj.style.color = "";
		}
	}

}

/* 

	Links two elements, so that clicking the source will highlight the destination
	source: String - The source id
	destination: String - The destination ID

*/
function add_link(source, destination) {

	var source_object = document.getElementById(source);
	let destination_object = document.getElementById(destination);

	if (source_object == null) {
		console.error("No such source id:" + source);
		return;
	}
	else if (destination_object == null) {
		console.error("No such destination id:" + destination);
		return;
	}

	if (source in link_groups) {
		link_groups[source].push(destination);
	}
	else {
		group_array = [source, destination];
		link_groups[source] = group_array;

		source_object.onclick = function() {set_active_link_group(source);}
	}
}

/* 

	Parses one of the group structs and adds the group it represents
	group_struct: The struct to parse

*/
function add_group_by_struct(group_struct) {
	let self = group_struct.self;
	let targets = group_struct.targets;
	let bidirectional = group_struct.bidirectional;

	for (i in targets) {
		add_link(self, targets[i]);
		if (bidirectional) {
			add_link(targets[i], self);
		}
	}

}

// Go through the links array and add them
for (x in links) {
	add_group_by_struct(links[x]);
}
