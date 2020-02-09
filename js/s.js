var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

var pjs = new Processing(canvas, function(processing) 
{
	processing.angleMode = "degrees";
});
pjs.angleMode = "degrees";

var mouse = {
	x: 0,
	y: 0
};

var keys = [];
pjs.keyPressed = function()
{
	keys[pjs.keyCode] = true;
	keys[pjs.key.toString()] = true;
};
pjs.keyReleased = function()
{
	delete keys[pjs.keyCode];
	delete keys[pjs.key.toString()];
};

canvas.width = 700;
canvas.height = 440;

pjs.size(canvas.width, canvas.height);

function Player(x, y, diameter)
{
	this.x = x;
	this.y = y;
	this.diameter = diameter;
	this.radius = this.diameter / 2;

	this.angle = 0;

	this.draw = function()
	{
		with(pjs)
		{
			fill(25, 245, 245, 100);
			strokeWeight(4);
			stroke(0, 40, 160);
			ellipse(this.x, this.y, this.diameter, this.diameter);

			noStroke();
			pushMatrix();
				translate(this.x, this.y);
				rotate(this.angle - 90);
				rect(-this.diameter * 0.1, 0, this.diameter * 0.2, this.diameter)
			popMatrix();
		}
	};

	this.move = function()
	{
		with(pjs)
		{
			if(keys[LEFT])
			{
				this.angle -= 5;
			}
			if(keys[RIGHT])
			{
				this.angle += 5;
			}

			if(keys[UP])
			{
				this.x += cos(this.angle) * 4;
				this.y += sin(this.angle) * 4;
			}
			if(keys[DOWN])
			{
				this.x -= cos(this.angle) * 4;
				this.y -= sin(this.angle) * 4;
			}
		}
	};
}
var player = new Player(200, 360, 30);

function trace(x, y)
{
	return {
		r: 0,
		g: 0,
		b: 140
	};
}

ctx.fillStyle = "rgb(0, 0, 0)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function loop()
{
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	var x, y, i, pixel;

	for(x = 0; x < canvas.width; x++)
	{
		for(y = 0; y < canvas.height * 0.26; y++)
		{
			i = x + y * canvas.width << 2;
			pixel = trace(x, y);

			imageData.data[i] = pixel.r;
			imageData.data[i + 1] = pixel.g;
			imageData.data[i + 2] = pixel.b;
			imageData.data[i + 3] = 255;
		}
	}

	ctx.putImageData(imageData, 0, 0);

	player.draw();
	player.move();
}

window.setInterval(loop, 1000 / 60);

