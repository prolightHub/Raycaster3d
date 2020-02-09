function main()
{
	size(600*1.3, 360*1.3);

	var levelInfo = {
		cellWidth : 30*1.3, 
		cellHeight : 30*1.3,
		width : width,
		height : height,

		level : "test",
	};

	var cam, player, pixels;

	var keys = [];
	var keyPressed = function()
	{
	    keys[keyCode] = true;
	    keys[key.toString()] = true;
	};
	var keyReleased = function()
	{
	    delete keys[keyCode];
	    delete keys[key.toString()];
	};

	smooth();

	var levels = {
		"test" : {
			plan : [
				"bbb                           bbb",
				"                       g        b",
				"                       g        b",
				"          rrrr         g        b",
				"                  gggggg        b",
				"                  g             b",
				" rrrr             g             b",
				" r            ggggg             b",
				" r  r                           b",
				" rrrr                           b",
				"                bbbbb           b",
				"                b   b           b",
				"bbb             bbbbb         bbb",
			] 
		}
	};

	var blocks = [];
	blocks.setup = function(cellWidth, cellHeight)
	{
		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;

		this.halfCellWidth = cellWidth / 2;
		this.halfCellHeight = cellHeight / 2;
	};
	blocks.loadFrom = function(level)
	{
		levelInfo.width = level.plan[0].length * this.cellWidth;
		levelInfo.height = level.plan.length * this.cellWidth;

		for(var col = 0; col < level.plan.length; col++)
		{
			var a = [];
			for(var row = 0; row < level.plan[col].length; row++)
			{
				a.push({});
			}
			this.push(a);
		}

		for(var col = 0; col < level.plan.length; col++)
		{
			for(var row = 0; row < level.plan[col].length; row++)
			{
				switch(level.plan[col][row])
				{
					case 'r' :
						this[col][row].color = { r: 150, g: 0, b: 0 };
						break;

					case 'g' :
						this[col][row].color = { r: 0, g: 150, b: 0 };
						break;

					case 'b' :
						this[col][row].color = { r: 0, g: 0, b: 150 };
						break;
				}
			}
		}

		var rows = [];

		for(var i = 0; i < this[0].length; i++)
		{	
			var a = [];
			for(var j = 0; j < this.length; j++)
			{
				a.push(this[j][i]);
			}
			rows.push(a);
		}

		this.length = 0;
		rows.forEach(row => this.push(row));

		this._length = this.length - 1;
		this[0]._length = this[0].length - 1;
	};
	blocks.getPlace = function(xPos, yPos)
	{
	    return {
	        col : constrain(round((xPos - this.halfCellWidth) / this.cellWidth), 0, this._length),
	        row : constrain(round((yPos - this.halfCellHeight) / this.cellHeight), 0, this[0]._length),
	    };
	};
	blocks.draw = function()
	{
		// noStroke();
		strokeWeight(1);
		stroke(255, 255, 255, 75);

		for(var col = cam.upperLeft.col; col <= cam.lowerRight.col; col++)
	    {
	        for(var row = cam.upperLeft.row; row <= cam.lowerRight.row; row++)
	        {
	        	var cell = this[col][row];

	        	if(cell.color)
	        	{
	        		fill(cell.color.r, cell.color.g, cell.color.b);
	        	}else{
	        		noFill();
	        	}

	        	rect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
	        }
	    }

	    noStroke();
	};

	var Camera = function(xPos, yPos, width, height)
	{
	    this.xPos = xPos;
	    this.yPos = yPos;
	    this.width = width;
	    this.height = height;

	    this.halfWidth = this.width / 2;
	    this.halfHeight = this.height / 2;
	    this.focusXPos = this.halfWidth;
	    this.focusYPos = this.halfHeight;

	    this.upperLeft = {
	        col : 0,
	        row : 0,
	    };
	    this.lowerRight = {
	        col : 0,
	        row : 0,
	    };

	    this.boundingBox = {};

	    this.speed = 0.1;

	    this.getObject = function()
	    {
	        return this;
	    };

	    this.attach = function(func, directAttach, time, endFunc)
	    {
	        if(this.getObject === func)
	        {
	            return;
	        }

	        this.lastGetObject = this.getObject;
	        this.getObject = func;
	        var object = func();
	        if(directAttach)
	        {
	            this.focusXPos = object.boundingBox.minY + (object.halfWidth);
	            this.focusYPos = object.boundingBox.minX + (object.halfHeight);
	        }
	        this.getObject.attachTime = millis();
	        this.getObject.time = time;
	        this.getObject.endFunc = endFunc;
	    };

	    this.updateBoundingBox = function()
	    {
	        this.boundingBox.minX = this.focusXPos - this.halfWidth;
	        this.boundingBox.minY = this.focusYPos - this.halfHeight;
	        this.boundingBox.maxX = this.focusXPos + this.halfWidth;
	        this.boundingBox.maxY = this.focusYPos + this.halfHeight;
	    };

	    this.updateBoundingBox();

	    this.translateXPos = this.xPos;
	    this.translateYPos = this.yPos;

	    this.view = function(object)
	    {
	        if(this.getObject.time !== undefined && 
	        millis() - this.getObject.attachTime > this.getObject.time)
	        {
	            (this.getObject.endFunc || function() {})();
	            this.getObject = this.lastGetObject || this.getObject;
	        }

	        if(object === undefined)
	        {
	            object = this.getObject();
	        }

	        //Get the camera position
	        var xPos = object.boundingBox.minX + (object.boundingBox.maxX - object.boundingBox.minX) / 2;
	        var yPos = object.boundingBox.minY + (object.boundingBox.maxY - object.boundingBox.minY) / 2;

	        this.angle = atan2(yPos - this.focusYPos, xPos - this.focusXPos);
	        this.distance = dist(this.focusXPos, this.focusYPos, xPos, yPos) * this.speed;

	        this.focusXPos += this.distance * cos(this.angle);
	        this.focusYPos += this.distance * sin(this.angle);

	        //Keep it in the grid
	        this.focusXPos = constrain(this.focusXPos, this.halfWidth, levelInfo.width - this.halfWidth);
	        this.focusYPos = constrain(this.focusYPos, this.halfHeight, levelInfo.height - this.halfHeight);

	        //Get the corners position on the grid
	        this.upperLeft = blocks.getPlace(this.focusXPos - this.halfWidth, this.focusYPos - this.halfHeight);
	        this.lowerRight = blocks.getPlace(this.focusXPos + this.halfWidth, this.focusYPos + this.halfHeight);

	        /*Translate stuff*/
	        this.translateXPos = this.xPos;
	        this.translateYPos = this.yPos;

	        if(levelInfo.width >= this.width)
	        {
	            this.translateXPos += this.halfWidth - this.focusXPos;
	        }
	        if(levelInfo.height >= this.height)
	        {
	            this.translateYPos += this.halfHeight - this.focusYPos;
	        }

	        this.updateBoundingBox();
	    };

	    this.translate = function()
	    {
	        translate(this.translateXPos, this.translateYPos);
	    };

	    this.untranslate = function()
	    {
	        translate(-this.translateXPos, -this.translateYPos);
	    };

	    this.drawOutline = function()
	    {
	    	noFill();
	    	strokeWeight(0.5);
	    	stroke(255, 255, 255, 100);
	    	rect(this.xPos, this.yPos, this.width, this.height);
	        noStroke();
	    };
	};

	var Player = function(xPos, yPos, diameter, Color)
	{
		this.xPos = xPos;
		this.yPos = yPos;

		this.diameter = diameter;
		this.radius = this.diameter / 2;

		this.color = Color || color(0, 140, 70);

		this.boundingBox = {};

		this.updateBoundingBox = function()
	    {
	        this.boundingBox.minX = this.xPos - this.radius;
	        this.boundingBox.minY = this.yPos - this.radius;
	        this.boundingBox.maxX = this.xPos + this.radius;
	        this.boundingBox.maxY = this.yPos + this.radius;
	    };

	    this.updateBoundingBox();

		this.draw = function()
		{
			pushMatrix();
				translate(this.xPos, this.yPos);
				rotate(this.angle);
				fill(this.color);
				rect(-this.radius, -this.radius / 2, this.diameter, this.radius, 5);
			popMatrix();
		};

		this.angle = 0;
		this.angleSpeed = 2.5;
		this.speed = 3;

		this.update = function()
		{
			if(keys.a || keys[LEFT])
			{
				this.angle -= this.angleSpeed;
			}
			else if(keys.d || keys[RIGHT])
			{
				this.angle += this.angleSpeed;
			}

			if(keys.w || keys[UP])
			{
				this.xPos += cos(this.angle) * this.speed;
				this.yPos += sin(this.angle) * this.speed;
			}
			else if(keys.s || keys[DOWN])
			{
				this.xPos -= cos(this.angle) * this.speed;
				this.yPos -= sin(this.angle) * this.speed;
			}

			this.updateBoundingBox();
		};
	};

	function setup()
	{	
		cam = new Camera(0, 0, width, height);
		player = new Player(0, 0, (levelInfo.cellWidth + levelInfo.cellHeight) / 2);

		blocks.setup(levelInfo.cellWidth, levelInfo.cellHeight);
		blocks.loadFrom(levels[levelInfo.level]);

		player.xPos = levelInfo.width / 2;
		player.yPos = levelInfo.height / 2;

		console.log(levelInfo);
	}

	setup();

	var physics = {
        resolveAngle : function(a)
        {
            a = a % 360;
            if(a < 0)
            {
                a = 360 - abs(a);  
            }
            return a;
        },
        crossProduct : function(p1, p2, p3)
        {
            return (p1.xPos - p3.xPos) * (p2.yPos - p3.yPos) - (p2.xPos - p3.xPos) * (p1.yPos - p3.yPos);
        },
        lineLine : function(x1, y1, x2, y2, x3, y3, x4, y4) 
        {
			var uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
			var uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
			return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
		},
        side : function(x, y, vx, vy, left, top, right, bottom)
        {
            var p = [-vx, vx, -vy, vy];
            var q = [x - left, right - x, y - top, bottom - y];
            var u1 = -Infinity;
            var u2 = Infinity;

            for(var i = 0; i < 4; i++) 
            {
                if(p[i] === 0) 
                {
                    if(q[i] < 0)
                    {
                        // return {};
                    }
                }else{
                    var t = q[i] / p[i];
                    if(p[i] < 0 && u1 < t)
                    {
                        u1 = t;
                    }
                    else if(p[i] > 0 && u2 > t)
                    {
                        u2 = t;
                    }
                }
            }

            if (u1 > u2 || u1 > 1 || u1 < 0)
            {
                // return {};
            }

            return {
                xPos : x + u1 * vx,
                yPos : y + u1 * vy
            };
        },
        intersectsRectangle : function(line, bx1, by1, bx2, by2)
        {
            var x1 = line.firstXPos;
            var y1 = line.firstYPos;

            var x2 = line.xPos;
            var y2 = line.yPos;

            var t = 0;

            if(x1 < bx1 && x2 >= bx1)
            {
                //  Left edge
                t = y1 + (y2 - y1) * (bx1 - x1) / (x2 - x1);

                if (t > by1 && t <= by2)
                {
                    return "left";
                }
            }
            else if(x1 > bx2 && x2 <= bx2)
            {
                //  Right edge
                t = y1 + (y2 - y1) * (bx2 - x1) / (x2 - x1);

                if (t >= by1 && t <= by2)
                {
                    return "right";
                }
            }

            if(y1 < by1 + 2 && y2 >= by1 + 2)
            {
                //  Top edge
                t = x1 + (x2 - x1) * (by1 - y1) / (y2 - y1);

                if(t >= bx1 && t <= bx2)
                {
                    return "top";
                }
            }
            else if(y1 > by2 && y2 <= by2)
            {
                //  Bottom edge
                t = x1 + (x2 - x1) * (by2 - y1) / (y2 - y1);

                if(t >= bx1 && t <= bx2)
                {
                    return "bottom";
                }
            }
        },
	};

	var raycaster = {
		raycasts : [],

		createRaycast : function(a, l)
		{
			var dx = cos(a);
			var dy = sin(a);

			var raycast = {
				xPos : player.xPos,// + dx * (l || 1),
				yPos : player.yPos,// + dy * (l || 1),
				firstXPos : player.xPos,
				firstYPos : player.yPos,
				angle : physics.resolveAngle(a),

				length : 0,
			};

			raycast.diffX = dx;
			raycast.diffY = dy;
			raycast.hypSq = Math.sqrt(Math.pow(raycast.diffX, 2) + Math.pow(raycast.diffY, 2));

			var angle = raycast.angle;
			raycast.wallX = (angle > 90 && angle <= 270) ? -1 : 1;
			raycast.wallY = (angle >= 180 && angle < 360) ? -1 : 1;

			raycast.hypX = raycast.hypSq / raycast.diffX;
			raycast.hypY = raycast.hypSq / raycast.diffY;

			return raycast;
		},
		drawRaycast : function(raycast)
		{
			// if(raycast.dead) return;

			strokeWeight(0.7);
			stroke(0, 30, 210);
			line(raycast.xPos, raycast.yPos, raycast.firstXPos, raycast.firstYPos);
		},
		drawRaycasts : function()
		{
			this.raycasts.forEach(raycast => this.drawRaycast(raycast));
		},
		step : function()
		{
			this.raycasts.forEach(function(raycast, index, raycasts)
			{
				if(raycast.dead) return;

				var place = blocks.getPlace(raycast.xPos, raycast.yPos);
				
				if(blocks[place.col][place.row].color)
				{
					if(mouseIsPressed)
					{
						// console.log(place.col, raycast.xPos, "  ", place.row, raycast.yPos);
						
						console.log(raycast.side);
					}

					raycast.dead = true;
					return;
				}

				var xBar, yBar;

				if(raycast.wallX === 1)
				{
					xBar = (place.col + 1) * blocks.cellWidth - raycast.xPos;
				}else{
					xBar = place.col * blocks.cellWidth - raycast.xPos;
				}
				if(raycast.wallY === 1)
				{
					yBar = (place.row + 1) * blocks.cellHeight - raycast.yPos;
				}else{
					yBar = place.row * blocks.cellHeight - raycast.yPos;
				}

				xBar = xBar || raycast.wallX;
				yBar = yBar || raycast.wallY;

				// var length = Math.min((xBar === 0) ? Infinity : xBar * raycast.hypX,
					    			  // /*(yBar === 0) ? Infinity :*/ yBar * raycast.hypY);
				var length = Math.min((xBar === 0) ? Infinity : xBar * raycast.hypX, 
					    			  (yBar === 0) ? Infinity : yBar * raycast.hypY);

				raycast.side = (length === xBar * raycast.hypX) ? 0 : 1;

				if(length > 70)
				{
					length = 1;
				}

				raycast.xPos += raycast.diffX * length;
				raycast.yPos += raycast.diffY * length;

				// if(blocks[place.col][place.row - 1].color)
				// {
				// 	raycast.dead = true;
				// 	// raycasts.splice(index - 1, 1);
				// }
			});
		},
		draw : function(pixels)
		{
			var mapped = [];

			// var dirX = -1, dirY = 0; //initial direction vector
   //          var planeX = 0, planeY = 0.66; //the 2d raycaster version of camera plane

			var pushed = false, i = 0;
			var xBar = 0, yBar = 0;
			var length;

			// var k = 0;
			// var l = 0;
			player.angle = physics.resolveAngle(player.angle);
			for(var a = player.angle - 40; a <= player.angle + 40; a += 0.4)
			{
				var raycast = raycaster.createRaycast(a, 5);
				// l++;

				pushed = false;
				while(true)
				{
					// ((length && xBar * raycast.hypX > yBar * raycast.hypY) > yBar ? raycast.diffX * length : 0)
					var place = blocks.getPlace(raycast.xPos, raycast.yPos);
					// var place2 = raycast.lastPlace;

					// place.col -= 1;
				
					var clr = blocks[place.col][place.row].color;

					if(clr)
					{	
						raycast.color = clr;

						//What goes here?
						// if(keys['o'])
						// {
						// 	var w = max(0, raycast.xPos - 2 - place.col * blocks.cellWidth);
						// 	var h = max(0, raycast.yPos - 2 - place.row * blocks.cellHeight);

						// 	// console.log(w * h + 
						// 	// 	(w * ((place.row + 1) * blocks.cellHeight - raycast.yPos + 2) / 2) + 
						// 	// 	(h * ((place.col + 1) * blocks.cellWidth - raycast.xPos + 2) / 2) < blocks.cellWidth * blocks.cellHeight / 2);


						// 	if(w * h + 
						// 		(w * ((place.row + 1) * blocks.cellHeight - raycast.yPos + 2) / 2) + 
						// 		(h * ((place.col + 1) * blocks.cellWidth - raycast.xPos + 2) / 2) < blocks.cellWidth * blocks.cellHeight / 2)
						// 	{
						// 		raycast.length -= length;
						// 	}

						// 	// console.log();

						// 	if(raycast.wallX === 1)
						// 	{
						// 		xBar = (place.col + 1) * blocks.cellWidth - raycast.xPos;
						// 	}else{
						// 		xBar = place.col * blocks.cellWidth - raycast.xPos;
						// 	}
						// 	if(raycast.wallY === 1)
						// 	{
						// 		yBar = (place.row + 1) * blocks.cellHeight - raycast.yPos;
						// 	}else{
						// 		yBar = place.row * blocks.cellHeight - raycast.yPos;
						// 	}

						// 	if(i === 0)
						// 	{
						// 		console.log(raycast.ySide + raycast.xSide, raycast.wallX + raycast.wallY);
						// 		keys['o'] = false;
						// 	}
						// 	//console.log(raycast.wallX, xBar, raycast.wallY, yBar);
						// }

						// if(physics.crossProduct(raycast, {
						// 	xPos : (place.col + 1) * blocks.cellWidth,
						// 	yPos : place.row * blocks.cellHeight
						// }, {
						// 	xPos : place.col * blocks.cellWidth,
						// 	yPos : (place.row + 1) * blocks.cellHeight
						// }) < 0)

						// var v = raycast.ySide + raycast.xSide;
						// var w = raycast.wallX + raycast.wallY;
						// if(v === 2 && w === 0 || w === -2)// : 
						// 	//(raycast.wallY === -1 && raycast.firstYPos > raycast.yPos))
						// {
						// 	//raycast.length -= length;
						// }
						
						// var op1 = raycast.length;
						// var opx = "."
						//var h_lf = 0;

						// var xPos = place.col * blocks.cellWidth, yPos = place.row * blocks.cellHeight;
						// var bottom = physics.lineLine(raycast.xPos, raycast.yPos, raycast.firstXPos, raycast.firstYPos, 

						// 							  xPos, yPos + blocks.cellHeight, xPos + blocks.cellWidth, yPos + blocks.cellHeight);
						// var right = physics.lineLine( raycast.xPos, raycast.yPos, raycast.firstXPos, raycast.firstYPos,

						// 							  xPos + blocks.cellWidth, yPos, xPos + blocks.cellWidth, yPos + blocks.cellHeight);
  				// var right =  lineLine(you.x,you.y, other.x,other.y, obstacle.x-obstacleSize/2,obstacle.y-obstacleSize/2, obstacle.x-obstacleSize/2,obstacle.y+obstacleSize/2);



	  					// if(raycast.se)
	  					// {	
	  					// 	raycast.length -= length;
	  					// }

						// if(keys['l'])//.. && i === 0)
						// {

						// 	// if(raycast.xPos > place.col * blocks.cellWidth + blocks.cellWidth / 2)
						// 	// {
						// 	// 	var l = ((place.col + 1) * blocks.cellWidth - raycast.xPos) * raycast.hypX;

						// 	// 	raycast.xPos += raycast.diffX * l;
						// 	// 	raycast.yPos += raycast.diffY * l;
						// 	// }
						// 	// else if(raycast.yPos > place.row * blocks.cellHeight + blocks.cellHeight / 2)
						// 	// {
						// 	// 	var l = ((place.row + 1) * blocks.cellHeight - raycast.yPos) * raycast.hypY;

						// 	// 	raycast.xPos += raycast.diffX * l;
						// 	// 	raycast.yPos += raycast.diffY * l;
						// 	// }

						// 	// if(abs(raycast.xPos - (place.col + 1) * blocks.cellWidth) < 2 || 
						// 	//    abs(raycast.yPos - (place.row + 1) * blocks.cellHeight) < 2)
						// 	// {
						// 	// 		raycast.length -= length;
						// 	// }
						// 	// if((!xBar && yBar) && raycast.wallX === -1 && raycast.wallY === -1)// || !yBar&&xBar&&raycast.wallY===-1)
						// 	// {
						// 	// 	raycast.stepLength = length;

						// 	// }

						// 	// if((xBar && !yBar) && raycast.wallX === 1 && raycast.wallY === -1)// || !yBar&&xBar&&raycast.wallY===-1)
						// 	// {
						// 	// 	raycast.length -= length;
						// 	// }

						// 	// console.log(bottom);

						// // 	console.log(
						// // 		raycast.length * raycast.length, 

						// // 	 	(Math.pow(abs((raycast.xPos - raycast.diffX * length) - raycast.firstXPos), 2) +
						// // 	 			  Math.pow(abs((raycast.yPos /*- raycast.diffY * length*/) - raycast.firstYPos), 2)));
						// }

						// if((raycast.wallX === -1 && raycast.firstXPos > raycast.xPos))
						// {
						// 	raycast.length -= length;
						// 	// console.log(true);
						// }
						// if(raycast.yPos > place.row * blocks.cellHeight / 2)
						// {
						// 	raycast.length -= length;
						// 	// console.log(true);
						// }

						if(keys['0'] && i === 0)
						{
							// var last = raycast.length;
							// raycast.length -= length;

                            //var vx = raycast.xPos;// + raycast.diffX;
                            //var vy = raycast.yPos;// + raycast.diffY;

                            var xPos = place.col * blocks.cellWidth, yPos = place.row * blocks.cellHeight;

                            var place = physics.side(raycast.xPos, raycast.yPos, raycast.firstXPos, raycast.firstYPos, 
                                                     xPos, yPos, xPos + blocks.cellWidth, yPos + blocks.cellHeight);



                          //  var side = physics.intersectsRectangle(raycast, xPos, yPos, xPos + blocks.cellWidth, yPos + blocks.cellHeight);

                            // console.log((place.xPos - xPos + blocks.cellWidth)/2, (place.yPos - yPos + blocks.cellWidth)/2);
                            if((place.xPos - xPos + blocks.cellWidth)/2 > 19.5 && (place.yPos - yPos + blocks.cellWidth)/2 == 19.5)
                            {
                                raycast.length -= length;
                            }

							// if(/*raycast.firstXPos + raycast.diffX * last > raycast.firstXPos + raycast.diffX * raycast.length || raycast.wallX === 1 ||*/
       //                          !(vx < raycast.firstXPos && physics.lineLine(vx, vy, raycast.firstXPos, raycast.firstYPos, 
       //                           xPos, yPos + blocks.cellHeight, xPos + blocks.cellWidth, yPos + blocks.cellHeight) || 
       //                           vy < raycast.firstYPos && physics.lineLine(vx, vy, raycast.firstXPos, raycast.firstYPos, 
       //                           xPos + blocks.cellWidth, yPos, xPos + blocks.cellWidth, yPos + blocks.cellHeight)))
							// {
							// 	raycast.length += length;
							// }
						}

						mapped.push(raycast);
						pushed = true;
						// k++;
						break;
					}

					blocks.getPlace(raycast.xPos, raycast.yPos);

					if(raycast.wallX === 1)
					{
						xBar = (place.col + 1) * blocks.cellWidth - raycast.xPos;
					}else{
						xBar = place.col * blocks.cellWidth - raycast.xPos;
					}
					if(raycast.wallY === 1)
					{
						yBar = (place.row + 1) * blocks.cellHeight - raycast.yPos;
					}else{
						yBar = place.row * blocks.cellHeight - raycast.yPos;
					}

					length = abs(Math.min((xBar || raycast.wallX * 30) * raycast.hypX, 
						    			  (yBar || raycast.wallY * 30) * raycast.hypY));
					// var length = abs(Math.min((xBar === 0) ? Infinity : xBar * raycast.hypX, 
					//     			          (yBar === 0) ? Infinity : yBar * raycast.hypY));

					//raycast.side = (length === xBar * raycast.hypX) ? 0 : 1;
					// if(mousePressed && mouseButton === RIGHT && length === 0)
					// {
					// 	console.log(true);
					// }

					// if(length > 60)
					// {
					// 	length = 30;
					// }

					// raycast.xSide = (length === xBar * raycast.hypX) ? 0 : 1;
					// raycast.ySide = (length === yBar * raycast.hypY) ? 0 : 1;

					// raycast.lastPlace = blocks.getPlace(raycast.xPos, raycast.yPos);


					// if(raycast.se === undefined)
					// {
						// if(xBar && raycast.wallX === -1)
						// {
						// 	raycast.se = true;
						// }else{
						// 	raycast.se = false;
						// }
					// }


					// raycast.se = !raycast.se;

					raycast.length += length;
					raycast.xPos += raycast.diffX * length;
					raycast.yPos += raycast.diffY * length;

					// var place = raycast.lastPlace;
					// if(blocks[place.col] && blocks[place.col][place.row] && blocks[place.col][place.row].color)
					// {
					// 	raycast.color = blocks[place.col][place.row].color;
					// 	mapped.push(raycast);
					// 	break;
					// }

					// i++;

					if(raycast.length > 7000 || i >= 300)
					{
						// console.log(length);
						//mapped.push({ r: 0, g: 0, b: 0, a: 0});
						break;
					}
				}

				if(!pushed)
				{
					// console.log(i);
					mapped.push({ r: 0, g: 0, b: 0 });

					// console.log(true);
				}
			}

			var x, y, l, drawStart, drawEnd, lineHeight;


			strokeWeight(1);
			for(x = 0; x < mapped.length; x++)
			{
				if(mapped[x].length === undefined || mapped[x].length === Infinity)
				{
					// this.verline(pixels, x, 40, 120 - 40, { r: 0, g: 0, b: 0 });
					continue;
				}
		     
				var lineHeight = round(1200 / mapped[x].length);

				var top = max(1, -lineHeight + 60);
				var bottom = min(120, lineHeight + 60);

				// if(x === 0 && mouseButton === RIGHT) 
				// {
				// 	console.log(top, bottom);
				// }
		       
				this.verline(pixels, x, top, bottom, mapped[x].color);
			}

			if(keys['l'])
			{
				for(x = 0; x < mapped.length; x++)
				{
					if(mapped[x].length === undefined || mapped[x].length === Infinity)
					{
						// this.verline(pixels, x, 40, 120 - 40, { r: 0, g: 0, b: 0 });
						continue;
					}
			     
					var lineHeight = round(1200 / (mapped[x].length - mapped[x].stepLength));

					var top = max(1, -lineHeight + 60);
					var bottom = min(120, lineHeight + 60);

					// if(x === 0 && mouseButton === RIGHT) 
					// {
					// 	console.log(top, bottom);
					// }
			       
					this.verline(pixels, x, top, bottom, mapped[x].color);
				}
			}

			strokeWeight(1);

			if(keys['m'])
			{
				console.log(mapped);
			}
		},
		project : function(height, angle, distance)
		{
			var z = distance * Math.cos(angle);
			var wallHeight = this.height * height / z;
			var bottom = this.height / 2 * (1 + 1 / z);
			return {
				top: bottom - wallHeight,
				height: wallHeight,
				bottom : bottom
			};
		},
		verline : function(pixels, x, drawStart, drawEnd, color)
		{
			stroke(color.r, color.g, color.b, 200);
			line(300 + x, drawStart, 300 + x, drawEnd);

			// for(var y = drawStart; y < drawEnd; y++)
			// {
			// 	l = ((300+ x) + y * width) * 4;

			// 	pixels[l] = color.r;
			// 	pixels[l + 1] = color.g;
			// 	pixels[l + 2] = color.b;
			// 	pixels[l + 3] = color.a || 245;
			// }
		}
	};

	draw = function()
	{
		this.background(0, 0, 0);
		
		pushMatrix();
			cam.view(player);
			cam.translate();

			blocks.draw();

			player.draw();
			player.update();

			raycaster.drawRaycasts();

			// fill(100, 0, 0);
			arc(player.xPos, player.yPos, 70, 70, player.angle - 40, player.angle - 39);
		popMatrix();

		cam.drawOutline();

		textSize(12);
		textAlign(LEFT, TOP)

		fill(255, 255, 255, 150);
		text("xPos " + player.xPos.toFixed(1) + " yPos " + player.yPos.toFixed(1), 10, 7);

		var place = blocks.getPlace(player.xPos, player.yPos);
		text("col " + place.col + " row " + place.row, 10, 25);

		// this.loadPixels();

		// if(!pixels)
		// {
			// pixels = this.imageData.data;
		// }

		// raycaster.step();
		raycaster.draw(pixels);

		// this.updatePixels();
	};

	var lastKeyPressed = keyPressed;
	keyPressed = function()
	{
		lastKeyPressed.apply(this, arguments);

		if(keys[" "])
		{
			for(var a = player.angle - 50; a <= player.angle + 40; a += 1)
			{
				raycaster.raycasts.push(raycaster.createRaycast(a));
			}
		}
		else if(keys.n)
		{
			raycaster.step();
		}
	};

	mousePressed = function()
	{
		if(mouseButton === RIGHT)
		{
			raycaster.step();
		}
	};
}

createProcessing(main);
