
// Variable for polling the ctrl key
CONTOL_HELD = false
document.onkeydown = function(e) {
	if (e.key = "Control") {
		CONTROL_HELD = true
		console.log("CTRL held")
	}
}
document.onkeyup = function(e) {
	if (e.key = "Control") {
		CONTROL_HELD = false
		console.log("CTRL released")
	}
}


// Utility structure for representing rectangles
function rectangle(x,y,width,height) {
	return {
		x : x,
		y : y,
		width : width,
		height : height,
	}
}

// Derive a rectangle from two points
function rectangle_from_points(a, b) {
	startx = Math.min(a.x, b.x)
	starty = Math.min(a.y, b.y)

	endx = Math.max(a.x, b.x)
	endy = Math.max(a.y, b.y)

	return rectangle(startx, starty, endx - startx, endy - starty)

}

// line segment structure
function segment(a, b) {
	return {
		a: a,
		b: b
	}
}

// returns if two lines overlap
// maybe unused
function line_intersect(seg1, seg2) {
	return (seg1.a > seg2.a) == (seg1.b > seg2.b);
}

// checks if two rectangles overlap
function rectangles_intersect(rect1, rect2) {
	rect1_seg_x = segment(rect1.x, rect1.x + rect1.width);
	rect2_seg_x = segment(rect2.x, rect2.x + rect2.width)
	
	rect1_seg_y = segment(rect1.y, rect1.y + rect1.height);
	rect2_seg_y = segment(rect2.y, rect2.y + rect2.height);

	return line_intersect(rect1_seg_x, rect2_seg_x) && line_intersect(rect1_seg_y, rect2_seg_y)
}

// utility structure for representing a 2d vector
function vec2(x,y) {
	return {
		x:x,y:y
	}
}

// returns an array of number 0 -> n
// obsolete
function zero_range(n) {
	var range = []
	for (var i = 0; i < n; i++) {
		range.push(n)
	}
	return range
}

// returns an array of numbers start -> end
// obsolete
function range(start, end) {
	
	if (! end > start) {return [start]}

	var range = [];
	for (var i = start; i < end; i++) {
		range.push(i)
	}

	return range
}

// vars for the div that owns the tables
const interactive_element = document.getElementById("interactive_area");
let interactive_area_rect = interactive_element.getBoundingClientRect();
let DEFAULT_SPAWN_POINT = vec2(interactive_area_rect.left,interactive_area_rect.top);


// utility class for representing the abstract matrix
class Matrix {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		var table = Array(height)
		for (var row = 0; row < height; row++)
		{
			table[row] = []
			for (var column = 0; column < width; column++) {
				table[row].push(Math.random())
			}
		}

		this.table = table;
	}

	// get an element
	get(i,j) {
		if (this.is_valid_cell(i,j)) {
			return this.table[i][j]
		}
		else {
			return 0;
		}
	}
	// set an element
	set(i,j,value) {
		if (this.is_valid_cell(i,j)) {
			this.table[i][j] = value
		}
	}

	// check if an index is valid
	is_valid_cell(i,j) {
		if (this.width == 0 || this.height == 0) {return false}
		return (
			i < this.height && i >= 0 &&
			j < this.width && j >= 0
		)
	}

	// copy from another matrix
	copy_from(source, offset) {
		for (row = 0; row < height; row++) {
			for (column = 0; column < width; column++) {
				this.set(row,column, source.get(row + offset.x, column + offset.y))
			}
		}

	}

}

// Starting cell for a drag selection
DRAG_SELECT_START = vec2(0,0)

// Set if drag vars need to be cleared
// obsolete
GLOBAL_CLEAR_DRAGS = false

// Matrix being dragged
MATRIX_TO_DRAG = null

// release matrix from mouse
document.onmouseup = function(e) {
	MATRIX_TO_DRAG = null
}

// move the matrix while dragging
document.onmousemove = function(e) {
	if (MATRIX_TO_DRAG) {
		MATRIX_TO_DRAG.WRAPPER.style.top = e.clientY + "px"
		MATRIX_TO_DRAG.WRAPPER.style.left = e.clientX + "px"
	}
}

// timer for popping out selections
// used to prevent single cell selections from instantly creating them
CLICK_TIMEOUT = false

class TableV2 {
	constructor(size_i, size_j) {
		this.DRAG_START = vec2(0,0)
		this.DRAG_END = vec2(0,0)
		this.matr = new Matrix(size_i, size_j)
		this.selected = [] // current selection rectangle
		this.dom_grid; // grid for dom elements corresponding to a given cell
		this.PRE_INIT = false

		// onclick for cells
		this.func_drag_start_unselected = function(e) {
			let p = e.target.PARENT
			p.DRAG_START = vec2(e.target.COLUMN, e.target.ROW)
			console.log("selection drag start (" + p.DRAG_START.x + "," + p.DRAG_START.y + ")")
		}

		// onmouseup for unselected
		this.func_drag_end_unselected = function(e) {
			let p = e.target.PARENT

			if (!p.DRAG_START) {return}

			p.DRAG_END = vec2(e.target.COLUMN, e.target.ROW)
			p.select_cells(rectangle_from_points(p.DRAG_START, p.DRAG_END))
			console.log("selection drag end (" + p.DRAG_END.x + "," + p.DRAG_END.y + ")")
			p.DRAG_START = null
			p.DRAG_END = null

			//prevents single cells from becoming other tables when clicked
			CLICK_TIMEOUT = true
			setTimeout(function() {
				CLICK_TIMEOUT = false
			}, 400)
		}

		// pops out selected cells
		this.func_tap_selected = function(e) {
			if (CLICK_TIMEOUT) {return}
			
			let zone = e.target.PARENT.selected_cells

			if (CONTROL_HELD) {
				e.target.PARENT.try_splitoff(zone)
				return
			}

			console.log(zone)
			e.target.PARENT.split(zone)

		}

		this.func_selected_mouseup = function(e) {
			e.target.WAITING = false
		}

		this.dom_root = this._create_dom_element()
		interactive_element.appendChild(this.dom_root)

		this.move_to(DEFAULT_SPAWN_POINT)

	}

	// reloads the visual representation of the matrix
	_reload_dom() {
		this.dom_root.remove()
		this.dom_root = null
		this.dom_root = this._create_dom_element()
		interactive_element.appendChild(this.dom_root)
	}

	// create the table
	_create_dom_element() {
		var wrapper = document.createElement("div")
		wrapper.classList.add("table_wrapper")

		//clear the dom grid
		this.dom_grid = []

		var table = document.createElement("table")

		for (var row = 0; row < this.matr.height; row++) {
			var dom_row = document.createElement("tr")
			this.dom_grid.push([])
			for (var column = 0; column < this.matr.width; column++) {

				console.log("get:" + this.matr.get(row,column))
				var text_node = document.createTextNode(new String(this.matr.table[row][column].toFixed(2)))
				
				var td = document.createElement("td")

				td.appendChild(text_node)

				td.ROW = row
				td.COLUMN = column
				td.PARENT = this

				this.dom_grid[row].push(td)

				td.onmousedown = this.func_drag_start_unselected;
				td.onmouseup = this.func_drag_end_unselected;

				dom_row.appendChild(td)

			}

			table.appendChild(dom_row)
			this.PRE_INIT = true
		}

		
		{ // create the header
			var header = document.createElement("span");
			var header_text = document.createTextNode(new String(this.matr.width) + "x" + new String(this.matr.height))
			header.WRAPPER = wrapper

			function drag_spot_start(e) {
				console.log("Drag matrix start")
				MATRIX_TO_DRAG = e.target
			}

			function drag_spot_continue(e) {
				
			}

			function drag_spot_end(e) {
				
			}

			header.onmousedown = drag_spot_start
			header.onmousemove = drag_spot_continue
			header.onmouseup = drag_spot_end

			header.appendChild(header_text)
			header.classList.add("table_header")
			wrapper.appendChild(header)
		}

		wrapper.appendChild(table)
		return wrapper
	}

	// select a cell group
	select_cells(zone) {

		zone.width += 1;
		zone.height += 1;
		console.log("Selecting cells:" + zone.x + "," + zone.y + ", " + zone.width + ",", zone.height)
		
		this.clear_selection()

		for (var row = zone.y; row < zone.y + zone.height; row++) {
			for (var column = zone.x; column < zone.x + zone.width; column++) {				
				this.select_cell(row,column)
			}
		}

		this.selected_cells = zone
	}

	// clear the current selection
	clear_selection() {
		for (var row in zero_range(this.matr.height)) {
			for (var column in zero_range(this.matr.width)) {
				this.deselect_cell(row,column)
			}
		}
	}

	deselect_cell(i,j) {
		
		var cell = this.dom_grid[i][j]
		console.log(cell)
		cell.onmousedown = this.func_drag_start_unselected;
		cell.onmouseup = this.func_drag_end_unselected;
		cell.onclick = null
		cell.style.backgroundColor = ""
	}

	select_cell(i,j) {
		//console.log("Selecting cell:" + i + "," + j)
		var cell = this.dom_grid[i][j]
		cell.style.backgroundColor = "red"
		cell.onmousedown = null
		cell.onmousedown = null
		cell.onclick = this.func_tap_selected
	}

	// move the table
	move_to(spot) {
		this.dom_root.style.top = spot.y + "px"
		this.dom_root.style.left = spot.x + "px"
	}

	// split off part of the table
	split(zone) {
		
		var new_matrix = new TableV2(zone.width, zone.height);
		console.log("Splitting matrix: zone:" + zone.x +"," + zone.y +"," + zone.width + "," + zone.height)
		
		console.log("copying")
 
		for (var row = 0; row < zone.height; row++) {
			for (var column = 0; column < zone.width; column ++) {
				new_matrix.matr.table[row][column] = this.matr.table[row + zone.y][column + zone.x]
			}
		}

		new_matrix._reload_dom()

		return new_matrix
	}

	// try to split and detach a section
	try_splitoff(zone) {
		//horizontal
		if (zone.width == this.matr.width) {
			// must be contiguous with top or bottom
			if (zone.y == 0) {
				
				return this.split_horizontal(zone.height)
			}
			if (zone.y + zone.height == this.matr.height) {
				return this.split_horizontal(zone.y)
			}
		}
		else if (zone.height == this.matr.height) {
			if (zone.x == 0) {
				return this.split_vertical(zone.width)
			}
			if (zone.x + zone.width == this.matr.width) {
				return this.split_vertical(zone.x)
			}
		}

	}

	// split at a column
	split_vertical(column) {
		var leftmatrix_spot
		var rightmatrix_spot
		{
			var rect = this.dom_root.getBoundingClientRect();
			leftmatrix_spot = vec2(rect.left, rect.top)

			let rightmatrix_left = this.dom_grid[0][column].getBoundingClientRect().left;
			rightmatrix_spot = vec2(rightmatrix_left, rect.top)
		}

		let leftmatrix_zone = rectangle(0,0,column,this.matr.height)
		let rightmatrix_zone = rectangle(column,0,this.matr.width - column, this.matr.height)

		var leftmatrix = this.split(leftmatrix_zone)
		var rightmatrix = this.split(rightmatrix_zone)

		leftmatrix.move_to(leftmatrix_spot)
		rightmatrix.move_to(rightmatrix_spot)

		this.remove()

		return [leftmatrix, rightmatrix]

	}

	// split at a row
	split_horizontal(row) {
		var topmatrix_spot
		var bottommatrix_spot
		{
			let rect = this.dom_root.getBoundingClientRect()
			topmatrix_spot = vec2(rect.left, rect.top)

			let bottommatrix_top = this.dom_grid[row][0].getBoundingClientRect().top
			bottommatrix_spot = vec2(rect.left, bottommatrix_top)
		}

		let topmatrix_zone = rectangle(0,0,this.matr.width,row)
		let bottommatrix_zone = rectangle(0,row,this.matr.width, this.matr.height - row)

		var topmatrix = this.split(topmatrix_zone)
		var bottommatrix = this.split(bottommatrix_zone)

		topmatrix.move_to(topmatrix_spot)
		bottommatrix.move_to(bottommatrix_spot)

		this.remove() // THIS LEAKS MEMORY. I DONT CARE.

		return [topmatrix, bottommatrix]

	}

	remove() {
		this.dom_root.remove()
	}

}

// create initial table
var table_default = new TableV2(20, 16)

//console.log(table_default)
console.log("Loaded.")