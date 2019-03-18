/*#############################################
# Name: Aurora "Murphy" Carlisle, Micah Jones #
# Instructor: Dr. Cen Li                      #
# Project: Project 4 pt. 3                    # 
#############################################*/

//TO DO:
// FIX TEXTURES

var program;
var canvas;
var gl;

var zoomFactor = .8;
var translateFactorX = 0.2;
var translateFactorY = -0.1;

var xrot = 0;
var yrot = 0;
var Radius = 1;
var phi = 30;
var theta = 20;
var deg = 0.5;

var numTimesToSubdivide = 5;
 
var pointsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var left = -1;
var right = 1;
var ytop = 1;
var bottom = -1;
var near = -10;
var far = 10;
var deg=5;

var eye=[2, 2, 2];
//var eye=[1,1,1];
var at=[0, 0, 0];
var up=[0, 1, 0];

var cubeCount=36;
var sphereCount=0;
var cylinderCount=0;

var N = 60; 
var cylPoints=[];

var nestPoints=[];

var grassAnim = false;
var grassDir = 0.01;
var grassMov = 0;

var eggAnim = false;
var eggDir1 = 0.01;
var eggMov1 = 0;
var eggDir2 = -0.01;
var eggMov2 = 0;
var eggDir3 = 0.01;
var eggMov3 = 0;
var eggShakeCount1 = 0;
var eggShakeCount2 = 0;
var eggShakeCount3 = 0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lightPosition = vec4(1, 0.6, 0.6, 0);

var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4(0.8, 0.8, 0.8, 1.0 );
var lightSpecular = vec4(1, 1, 1, 1.0 );

var materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
var materialDiffuse = vec4( 0.0, 0.5, 1, 1.0);
var materialSpecular = vec4( 0, 0, 1, 1.0 );

var materialShininess = 25.0;

var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var mvMatrixStack=[];

var sounds = [];

// texture coordinates
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0),
];

var grassTexture, orangeTexture, twigTexture, leafTexture, cloudTexture, skyTexture, white;

window.onload = function init() 
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // set up lighting and material
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // generate the points/normals
    GeneratePoints();

    //declare sounds
    sounds.push(new Audio("birdsChirping.mp3"));
    
    // pass data onto GPU
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
	
	
    // set up texture buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

	
  
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );

    // support user interface
    document.getElementById("zoomIn").onclick=function(){zoomFactor *= 0.95;};
    document.getElementById("zoomOut").onclick=function(){zoomFactor *= 1.05;};
    document.getElementById("left").onclick=function(){translateFactorX -= 0.1;};
    document.getElementById("right").onclick=function(){translateFactorX += 0.1;};
    document.getElementById("up").onclick=function(){translateFactorY += 0.1;};
    document.getElementById("down").onclick=function(){translateFactorY -= 0.1;};


    EstablishTextures();
	
    // keyboard handle
    window.onkeydown = HandleKeyboard;

    render();
}

function HandleKeyboard(event)
{
    switch (event.keyCode)
    {
    case 37:  // left cursor key
              phi -= deg;
              break;
    case 39:   // right cursor key
              phi += deg;
              break;
    case 38:   // up cursor key
              theta += deg;
              break;
    case 40:    // down cursor key
              theta -= deg;
              break;
    case 65:    //'a' key for animation
            grassAnim = !grassAnim;
            eggAnim = !eggAnim;
            sounds[0].play();

            break;
    case 66:    //'b' key to reset
            zoomFactor = .8;
            translateFactorX = 0.2;
            translateFactorY = -0.1;
            phi = 30;
            theta = 20;

    case 90:    //'z' key for zoom in
            zoomFactor *= 0.95;
            break;
    case 88:    //'x' key for zoom out
            zoomFactor *= 1.05;
            break;
    }
}

// ******************************************
// Generate Points
// ******************************************
function GeneratePoints()
{
    //cube
    //starts @ point 0, length = 36
    GenerateCube();

    //sphere
    //starts @ point 36, length = 12288 
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    //cone
    //starts @ point 12324, length = 1056
    //length = ((stacks-2)*6+2*3)*slices=(10*6+6)*16=1056
    GenerateCone();
    
    //cylinder, extruded object
    //starts @ point 13380, length = 780
    GenerateCylinder();

    //grass mesh
    //starts @ point 14160, length = 15
    GenerateGrass();
	
    //birdhouse mesh
    //starts @ point 14175, length = 48
    GenerateBirdHouse();

    //nest, surface revolution object
    ///starts @ point 14223, length = 216 
    GenerateNest();
}

function GenerateCube()
{
    var cubeVertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 )
    ];

    //quad(vec4, vec4, vec4, vec4, colorIndex)
    quad(cubeVertices[1], cubeVertices[0], cubeVertices[3], cubeVertices[2] );
    quad(cubeVertices[2], cubeVertices[3], cubeVertices[7], cubeVertices[6] );
    quad(cubeVertices[3], cubeVertices[0], cubeVertices[4], cubeVertices[7] );
    quad(cubeVertices[6], cubeVertices[5], cubeVertices[1], cubeVertices[2] );
    quad(cubeVertices[4], cubeVertices[5], cubeVertices[6], cubeVertices[7] );
    quad(cubeVertices[5], cubeVertices[4], cubeVertices[0], cubeVertices[1] );

}

function GenerateCone()
{
    radius = 0.5
    height = 1
    stacks = 12
    slices = 16
    var hypotenuse=Math.sqrt(height*height + radius*radius);
	var cosTheta = radius/hypotenuse;
	var sinTheta = height/hypotenuse;

    // starting out with a single line in xy-plane
	var line=[];
	for (var p=0; p<=stacks; p++)  {
	    line.push(vec4(p*hypotenuse/stacks*cosTheta, p*hypotenuse/stacks*sinTheta, 0, 1));
    }

    prev = line;
    // rotate around y axis
    var m=rotate(360/slices, 0, 1, 0);
    for (var i=1; i<=slices; i++) {
        var curr=[]

        // compute the new set of points with one rotation
        for (var j=0; j<=stacks; j++) {
            var v4 = multiply(m, prev[j]);
            curr.push( v4 );
        }

        // triangle bottom of the cone
        triangle(prev[0], curr[1], prev[1]);

        // create the triangles for this slice
        for (var j=1; j<stacks; j++) {
            prev1 = prev[j];
            prev2 = prev[j+1];

            curr1 = curr[j];
            curr2 = curr[j+1];

            quad(prev1, curr1, curr2, prev2);
        }

        prev = curr;
    }

}

function GenerateCylinder()
{
    var height = 2;
    var radius = 1.0;

    var angle = 2*Math.PI/N;

    cylPoints = [vec4(0,0,0,1)];
    for  (var i = N; i >= 0; i--) {
        cylPoints.push(vec4(radius * Math.cos(i * angle), 0,
            radius * Math.sin(i * angle), 1));
    }

    N=cylPoints.length;

    // Circle for the "top"
    for  (var i = 0; i < N; i++) {
        cylPoints.push(vec4(cylPoints[i][0], cylPoints[i][1]+height,
            cylPoints[i][2], 1));
    }

    var basePoints=[];
    var topPoints=[];
 
    // create the face list 
    // add the side faces first --> N quads
    for (var j=0; j<N; j++)
    {
        quad(cylPoints[j], cylPoints[j+N], cylPoints[(j+1)%N+N], cylPoints[(j+1)%N]);  
        cylinderCount += 6;
    }

    // the first N vertices come from the base 
    basePoints.push(cylPoints[0]);
    for (var i=N-1; i>0; i--)
    {
        basePoints.push(cylPoints[i]);  // index only
    }
    // add the base face as the Nth face
    polygon(basePoints);

    // the next N vertices come from the top 
    for (var i=0; i<N; i++)
    {
        topPoints.push(cylPoints[i+N]); // index only
    }
    // add the top face
    polygon(topPoints);

}

//Micah
function GenerateGrass()
{
    var bladePoints=[
            vec4(-0.4, 0, 0, 1),        //0
            vec4(-0.2, 0.8, 0.1, 1),    //1
            vec4(0, 0, 0.2, 1),         //2
            vec4(0.2, 0.6, 0.2, 1),     //3
            vec4(0.4, 0, 0.2, 1),       //4
            vec4(0.3, 0.5, 0, 1),       //5
            vec4(0.2, 0, -0.2, 1),      //6
            vec4(0, 0.7, -0.2, 1),      //7
            vec4(-0.2, 0, -0.2, 1),     //8
            vec4(-0.3, 0.4, -0.1, 1),   //9

        ];


    triangle(bladePoints[0], bladePoints[1], bladePoints[2]);
    triangle(bladePoints[2], bladePoints[3], bladePoints[4]);
    triangle(bladePoints[4], bladePoints[5], bladePoints[6]);
    triangle(bladePoints[6], bladePoints[7], bladePoints[8]);
    triangle(bladePoints[8], bladePoints[9], bladePoints[0]);


}

//Murphy
function GenerateBirdHouse(){
	var housePoints = [
        vec4(0, 0, 0, 1),      // 0
        vec4(1, 0, 0, 1),      // 1
        vec4(1, 1, 0, 1),      // 2
        vec4(0.5, 1.5, 0, 1),  // 3
        vec4(0, 1, 0, 1),      // 4
        vec4(0, 0, 1, 1),      // 5
        vec4(1, 0, 1, 1),      // 6
        vec4(1, 1, 1, 1),      // 7
        vec4(0.5, 1.5, 1, 1),  // 8
        vec4(0, 1, 1, 1)       // 9
    ];
	
    quad(housePoints[0], housePoints[5], housePoints[9], housePoints[4]);   
    quad(housePoints[3], housePoints[4], housePoints[9], housePoints[8]);   
    quad(housePoints[2], housePoints[3], housePoints[8], housePoints[7]);
    quad(housePoints[1], housePoints[2], housePoints[7], housePoints[6]);
    quad(housePoints[0], housePoints[1], housePoints[6], housePoints[5]);
    pentagon(housePoints[5], housePoints[6], housePoints[7], housePoints[8], housePoints[9]);  
    pentagon(housePoints[0], housePoints[4], housePoints[3], housePoints[2], housePoints[1]);  
}

function GenerateNest(){
    //initial shape
    var nest = [
        [0, 0, 0],       // 0
        [0.25, 0, 0],    // 2
        [0.5, 0.05, 0],   // 4
        [0.7, 0.25, 0],  // 6
        [0.6, 0.38, 0],  // 7
        [0.4, 0.35, 0],  // 5
        [0.25, 0.25, 0], // 3
        [0, 0.25, 0],    // 1
    ];

    	//Setup initial points matrix
	for (var i = 0; i<7; i++)
	{
		nestPoints.push(vec4(nest[i][0], nest[i][1], 
                                   nest[i][2], 1));
	}

	var r;
        var t=Math.PI/3;

        // sweep the original curve another "angle" degree
	for (var j = 0; j < 6; j++)
	{
                var angle = (j+1)*t; 

                // for each sweeping step, generate 7 new points corresponding to the original points
		for(var i = 0; i < 7 ; i++ )
		{	
		        r = nestPoints[i][0];
                        nestPoints.push(vec4(r*Math.cos(angle), nestPoints[i][1], -r*Math.sin(angle), 1));
		}    	
	}


       var N=7; 
       // quad strips are formed slice by slice (not layer by layer)
       for (var i=0; i<6; i++) // slices
       {
           for (var j=0; j<6; j++)  // layers
           {

		quad(nestPoints[i*N+j], nestPoints[(i+1)*N+j], nestPoints[(i+1)*N+(j+1)], nestPoints[i*N+(j+1)]); 
           }
       }
}



// ******************************************
// Draw simple and primitive objects
// ******************************************
function DrawSolidSphere(width, height)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(width, height, width);   // scale to the given radius
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
 	// draw unit radius sphere
        for( var i=0; i<sphereCount; i+=3)
            gl.drawArrays( gl.TRIANGLES, cubeCount+i, 3 );

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawSolidCube(length)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(length, length, length );   // scale to the given width/height/depth 
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
        gl.drawArrays( gl.TRIANGLES, 0, 36);

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawSolidCone(length)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(length, length, length );   // scale to the given width/height/depth 
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	 
        gl.drawArrays( gl.TRIANGLES, 12324, 1056);

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawSolidCylinder(width, height)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(width, height, width );   // scale to the given width/height/depth 
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
        gl.drawArrays( gl.TRIANGLES, 13380, 780);

	modelViewMatrix=mvMatrixStack.pop();
}

//Micah
function DrawGrass(width, height, rotation, shear)
{
        var shearMat = mat4(
            vec4(1.0, shear, 0.0, 0.0),
            vec4(0.0,   1.0, 0.0, 0.0),
            vec4(0.0,   0.0, 1.0, 0.0),
            vec4(0.0,   0.0, 0.0, 1.0)
        );

        
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);
        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 2);

        // lighting and material for grass blades
        materialAmbient = vec4( 1, 1, 1, 1.0 );
        materialDiffuse = vec4( 69/255, 186/255, 37/255, 1.0);
        materialSpecular = vec4( 0, 0, 0, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        mvMatrixStack.push(modelViewMatrix);
        s=scale4(width, height, width );   // scale to the given width/height/depth 
        r=rotate(rotation, 0, 1, 0);
        modelViewMatrix = mult(modelViewMatrix, s);
        modelViewMatrix = mult(modelViewMatrix, r);
        modelViewMatrix = mult(modelViewMatrix, shearMat);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
        gl.drawArrays( gl.TRIANGLES, 14160, 15);

		modelViewMatrix=mvMatrixStack.pop();

}

//Murphy
function DrawBirdHouse(width, height, rotation){
    
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);

        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

        // lighting and materials for the bird house, stand, and perch
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 201/255, 163/255, 46/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();


	//mesh portion/main bird house
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(width, height, width );   // scale to the given width/height/depth 
	r=rotate(rotation, 0, 1, 0);
	t=translate(0, 0, 0);
	modelViewMatrix = mult(modelViewMatrix, s);
	modelViewMatrix = mult(modelViewMatrix, t);
	modelViewMatrix = mult(modelViewMatrix, r);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	gl.drawArrays( gl.TRIANGLES, 14175, 48);
	modelViewMatrix=mvMatrixStack.pop();
	
        
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);

	//stand
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.1, -0.5, -0.1);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.008, 0.3);
	modelViewMatrix=mvMatrixStack.pop();
	
	//perch
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(90, 0, 0, 1);
	t=translate(0.27, 0.04, -0.1);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.007, 0.05);
	modelViewMatrix=mvMatrixStack.pop();
	
        
        // lighting and materials for the bird house, stand, and perch
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 0/255, 0/255, 0/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

	//hole
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(90, 0, 0, 1);
	t=translate(0.21, 0.125, -0.1);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.05, 0.003);
	modelViewMatrix=mvMatrixStack.pop();
}

function DrawEgg(width, height, shear)
{
        var shearMat = mat4(
            vec4(1.0, shear, 0.0, 0.0),
            vec4(0.0,   1.0, 0.0, 0.0),
            vec4(0.0,   0.0, 1.0, 0.0),
            vec4(0.0,   0.0, 0.0, 1.0)
        );

        mvMatrixStack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, shearMat);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
        DrawSolidSphere(width, height);

	modelViewMatrix=mvMatrixStack.pop();

}


// start drawing the wall
function DrawWall(thickness)
{
	var s, t, r;

	// draw thin wall with top = xz-plane, corner at origin
	mvMatrixStack.push(modelViewMatrix);

	t=translate(0.5, 0.5*thickness, 0.5);
	s=scale4(1.0, thickness, 1.0);
        modelViewMatrix=mult(mult(modelViewMatrix, t), s);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawNest(){
    var s;

        // lighting and materials for the bird nest
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 107/255, 91/255, 36/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();
		
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    mvMatrixStack.push(modelViewMatrix);
    
    s=scale4(0.15, 0.15, 0.15);
    modelViewMatrix=mult(modelViewMatrix, s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 14223, 216);


    modelViewMatrix = mvMatrixStack.pop();

}

// ******************************************
// Draw composite objects
// ******************************************

//Micah
function DrawTree()
{
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 2);
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 3);

        // lighting and materials for the tree leaves
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 69/255, 186/255, 37/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        //spheres of "leaves"
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, 0.5, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.25, 0.4);
	modelViewMatrix=mvMatrixStack.pop(); 

        mvMatrixStack.push(modelViewMatrix);
	t=translate(0.2, 0.6, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.18, 0.3);
	modelViewMatrix=mvMatrixStack.pop(); 

        
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);

        // lighting and materials for the tree trunk and branches
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 115/255, 73/255, 18/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();


        //tree trunk
    	mvMatrixStack.push(modelViewMatrix);
        t=translate(0.0, -0.2, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.04, 0.2);
	modelViewMatrix=mvMatrixStack.pop();


        //branch 1 (with offset branch)
    	mvMatrixStack.push(modelViewMatrix);
        r=rotate(65, 1, 0, 0);
        t=translate(0.0, 0.3, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
        modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.02, 0.25);
	modelViewMatrix=mvMatrixStack.pop();

        mvMatrixStack.push(modelViewMatrix);
        r=rotate(65, 1, 0, 0);
        t=translate(0.0, 0.46, 0.35);
	modelViewMatrix=mult(modelViewMatrix, t);
        modelViewMatrix=mult(modelViewMatrix, r);
        r=rotate(-50, 0, 0, 1);
        modelViewMatrix=mult(modelViewMatrix, r);
        DrawSolidCylinder(0.01, 0.1);
	modelViewMatrix=mvMatrixStack.pop();

    //branch 2
    	mvMatrixStack.push(modelViewMatrix);
        r=rotate(65, 1, 0, 0);
        t=translate(0.0, 0.55, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
        modelViewMatrix=mult(modelViewMatrix, r);
        r=rotate(45, 0, 0, 1);
        modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.015, 0.15);
	modelViewMatrix=mvMatrixStack.pop();
    
    //branch 3      
    	mvMatrixStack.push(modelViewMatrix);
        r=rotate(15, 1, 0, 0);
        t=translate(0.0, 0.4, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
        modelViewMatrix=mult(modelViewMatrix, r);
        r=rotate(-65, 0, 0, 1);
        modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.018, 0.25);
	modelViewMatrix=mvMatrixStack.pop();

    //branch 4
       	mvMatrixStack.push(modelViewMatrix);
        r=rotate(-65, 0, 0, 1);
        r=mult(r, rotate(30, 0, 0, 1));
        t=translate(0.0, -0.02, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
        modelViewMatrix=mult(modelViewMatrix, r);
        //r=rotate(-65, 0, 0, 1);
        //modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.018, 0.25);
	modelViewMatrix=mvMatrixStack.pop();


}

//Micah
function DrawAllTheGrass()
{
        
        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.2, 0.0, 0.2);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 0, grassMov);
	modelViewMatrix=mvMatrixStack.pop();

        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.4, 0.0, 0.8);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 15, grassMov);
	modelViewMatrix=mvMatrixStack.pop();


        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.6, 0.0, 0.4);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 30, grassMov);
	modelViewMatrix=mvMatrixStack.pop();
    
        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.8, 0.0, 0.6);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 45, grassMov);
	modelViewMatrix=mvMatrixStack.pop();

        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.85, 0.0, 0.2);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 60, grassMov);
	modelViewMatrix=mvMatrixStack.pop();

        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.1, 0.0, 0.5);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 75, grassMov);
	modelViewMatrix=mvMatrixStack.pop();

        mvMatrixStack.push(modelViewMatrix);
        t=translate(0.7, 0.0, 0.9);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawGrass(0.1, 0.1, 90, grassMov);
	modelViewMatrix=mvMatrixStack.pop();
}

//Murphy
function DrawBird(){

        
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);

        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 6);

        // lighting and materials for the bird head and body
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 59/255, 201/255, 219/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

	// draw body
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.25, 0.42,0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.15, 0.1);
	modelViewMatrix=mvMatrixStack.pop();

	//draw head
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.18, 0.57, 0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.08, 0.08);
	modelViewMatrix=mvMatrixStack.pop();
	
    
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);

       //gl.uniform1i(gl.getUniformLocation(program, "texture"), 6);

        // lighting and materials for the bird beak and legs
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 217/255, 211/255, 35/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();


	//draw beak
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-87, 0, 0, 1);
	t=translate(0.055, 0.55, 0);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCone(0.05);
	modelViewMatrix=mvMatrixStack.pop();

    // draw left leg
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.23, 0.25, -0.05);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.008, 0.04);
	modelViewMatrix=mvMatrixStack.pop();
	

	//draw right leg
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.23, 0.25, 0.05);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.008, 0.04);
	modelViewMatrix=mvMatrixStack.pop();

	//draw left foot
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.23, 0.25, -0.05);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.03, 0.002);
	modelViewMatrix=mvMatrixStack.pop();

	//draw right foot
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.23, 0.25, 0.05);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.03, 0.002);
	modelViewMatrix=mvMatrixStack.pop();
	

        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 6);

        // lighting and materials for the bird wings and tail
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 2/255, 133/255, 199/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

	//draw left wing
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(110, 90, 0, 1);
	t=translate(0.24, 0.43, -0.16);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.1, 0.003);
	modelViewMatrix=mvMatrixStack.pop();
	

	//draw right wing
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-110, 90, 0, 1);
	t=translate(0.24, 0.43, 0.16);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.1, 0.003);
	modelViewMatrix=mvMatrixStack.pop();

	//draw tail
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-110, 0, 0, 1);
	t=translate(0.39, 0.5, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.125, 0.003);
	modelViewMatrix=mvMatrixStack.pop();

        // lighting and materials for the bird eyes
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 0/255, 0/255, 0/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

	//draw left eye
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-90, 0, 0, 1);
	t=translate(0.1, 0.58, -0.03);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.009, 0.004);
	modelViewMatrix=mvMatrixStack.pop();
	
	//draw right eye
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-90, 0, 0, 1);
	t=translate(0.1, 0.58, 0.03);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.009, 0.004);
	modelViewMatrix=mvMatrixStack.pop();

	
}

//New Objects
function DrawCloud(){
        // lighting and materials for the clouds
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 255/255, 255/255, 255/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        //spheres of "clouds"
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, 0.0, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.1, 0.1);
	modelViewMatrix=mvMatrixStack.pop();

        //spheres of "clouds"
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, -0.02, 0.1);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.08, 0.08);
	modelViewMatrix=mvMatrixStack.pop();

        //spheres of "clouds"
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, -0.02, -0.1);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.06, 0.06);
	modelViewMatrix=mvMatrixStack.pop(); 

         //spheres of "clouds"
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, -0.01, 0.2);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.04, 0.04);
	modelViewMatrix=mvMatrixStack.pop(); 

}

function DrawOrange(){
	
    
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 2);
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);


	 // lighting and materials for the bird eyes
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 210/255, 80/255, 0/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();
	
	//fruit
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.0, 0.0, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.06, 0.06);
	modelViewMatrix=mvMatrixStack.pop(); 
	
	// lighting and materials for the bird eyes
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 0/255, 100/255, 10/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();
	
        	//leaves
    
    
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1);
        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-170, 90, 0, 1);
	t=translate(0.05, 0.055, 0.0);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawSolidCylinder(0.03, 0.003);
	modelViewMatrix=mvMatrixStack.pop();
	
	
}

function DrawOranges(){
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(0.5, 0.5, 0.5);
	t=translate(0.46, 0.5, 0.3);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, s);
	DrawOrange();
	modelViewMatrix=mvMatrixStack.pop();
	
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(0.5, 0.5, 0.5);
	t=translate(0.99, 0.5, 0.3);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, s);
	DrawOrange();
	modelViewMatrix=mvMatrixStack.pop();
	
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(0.5, 0.5, 0.5);
	t=translate(1, 0.9, 0.45);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, s);
	DrawOrange();
	modelViewMatrix=mvMatrixStack.pop();
	
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(0.5, 0.5, 0.5);
	t=translate(0.73, 0.05, 0.4);
	modelViewMatrix=mult(modelViewMatrix, t);
	modelViewMatrix=mult(modelViewMatrix, s);
	DrawOrange();
	modelViewMatrix=mvMatrixStack.pop();
	
}


// ******************************************
// Render
// ******************************************
function render()
{
	var s, t, r;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

    
   	// set up view and projection
   	projectionMatrix = ortho(left*zoomFactor-translateFactorX, right*zoomFactor-translateFactorX,
	bottom*zoomFactor-translateFactorY, ytop*zoomFactor-translateFactorY, near, far);
        
        eye = vec3(
            Radius*Math.cos(theta*Math.PI/180.0)*Math.cos(phi*Math.PI/180.0),
            Radius*Math.sin(theta*Math.PI/180.0),
            Radius*Math.cos(theta*Math.PI/180.0)*Math.sin(phi*Math.PI/180.0)
        );
   	modelViewMatrix=lookAt(eye, at, up);
 	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
/*
	// draw the sphere
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.25, 0.42,0.35);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidSphere(0.1, 0.1);
	modelViewMatrix=mvMatrixStack.pop();


	// draw the cone
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.1, 0.5 ,0.5);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCone(0.1);
	modelViewMatrix=mvMatrixStack.pop();

    // draw the cylinder
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.8, 0.2, 0.2);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawSolidCylinder(0.1, 0.2);
	modelViewMatrix=mvMatrixStack.pop();
	
*/


	// lighting and material for grass "floor"
        materialAmbient = vec4( 0.6, 0.6, 0.6, 1.0 );
        materialDiffuse = vec4( 94/255, 232/255, 56/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=0;
        SetupLightingMaterial(); 
       
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 2);
 
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 2);
	// wall # 1: in xz-plane
	DrawWall(0.02); 

        gl.uniform1i(gl.getUniformLocation(program, "texture"), 5);

    	// lighting and material for sky "walls"
        materialAmbient = vec4( .2, .2, .2, 1.0 );
        materialDiffuse = vec4( 96/255, 188/255, 235/255, 1.0);
        materialSpecular = vec4( 0.5, 0.5, 0.5, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

	// wall #2: in yz-plane
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(90.0, 0.0, 0.0, 1.0);
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02); 
	modelViewMatrix=mvMatrixStack.pop();
	
	// wall #3: in xy-plane
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-90, 1.0, 0.0, 0.0);
	//r=rotate(90, 1.0, 0.0, 0.0);  // ??
	modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02); 
	modelViewMatrix=mvMatrixStack.pop();


	//Micah's Objects
	// tree
	mvMatrixStack.push(modelViewMatrix);
	//r=rotate(-90, 1.0, 0.0, 0.0);
	//r=rotate(90, 1.0, 0.0, 0.0);  // ??
	t=translate(0.7, 0.2, 0.3);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawTree(); 
	modelViewMatrix=mvMatrixStack.pop();


        if(grassAnim){
            if(grassMov > 0.35 || grassMov <-0.35){
                grassDir *= -1;
                grassMov += grassDir * 3;
            }
            else { grassMov += grassDir * 3; }
        }

	DrawAllTheGrass(); 


	//Murphy's Objects
	//Draw Bird
	mvMatrixStack.push(modelViewMatrix);
    s=scale4(0.2,0.2,0.2);
	r=rotate(180, 0, 1, 0);
	t=translate(-3.60, 3.45, -3.25);
    modelViewMatrix=mult(modelViewMatrix, s);
	modelViewMatrix=mult(modelViewMatrix, r);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawBird(); 
	modelViewMatrix=mvMatrixStack.pop();
	
	
	//Draw Birdhouse
	mvMatrixStack.push(modelViewMatrix);
    s=scale4(0.6,0.6,0.6);
 	t=translate(0.2, 0.5, 1.3);
    modelViewMatrix=mult(modelViewMatrix, s);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawBirdHouse(0.2, 0.2, 90);
	modelViewMatrix=mvMatrixStack.pop(); 

        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 1); //stop texture
	//Draw Nest
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.7, 0.68, 0.61);
	modelViewMatrix=mult(modelViewMatrix, t);
	DrawNest();
	modelViewMatrix=mvMatrixStack.pop();


        if(eggAnim){
            eggShakeCount1 += 1;
            eggShakeCount2 += 1;
            eggShakeCount3 += 1;

            if(eggShakeCount1 > 20){
                if(eggMov1 > 0.03 || eggMov1 <-0.03){
                    eggDir1 *= -1;
                    eggMov1 += eggDir1 * 3;
                }
                else { eggMov1 += eggDir1 * 3;}

                if(eggShakeCount1 > 40) {eggShakeCount1 = 0;}
            }

            if(eggShakeCount2 > 40){
                if(eggMov2 > 0.03 || eggMov2 <-0.03){
                    eggDir2 *= -1;
                    eggMov2 += eggDir2 * 3;
                }
                else { eggMov2 += eggDir2 * 3;}

                if(eggShakeCount2 > 80) {eggShakeCount2 = 0;}
            }

            if(eggShakeCount3 > 25){
                if(eggMov3 > 0.03 || eggMov3 <-0.03){
                    eggDir3 *= -1;
                    eggMov3 += eggDir3 * 3;
                }
                else { eggMov3 += eggDir3 * 3;}

                if(eggShakeCount3 > 80) {eggShakeCount3 = 0;}
            }
        }

        
        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


        // lighting and materials for the first egg
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 218/255, 242/255, 241/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        //egg1
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.71, 0.72, 0.59);
	modelViewMatrix=mult(modelViewMatrix, t);
    DrawEgg(0.015, 0.025, eggMov1);
	modelViewMatrix=mvMatrixStack.pop();

        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


        // lighting and materials for the second egg
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 156/255, 198/255, 219/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        //egg2
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.68, 0.72, 0.6);
	modelViewMatrix=mult(modelViewMatrix, t);
        DrawEgg(0.015, 0.025, eggMov2);
	modelViewMatrix=mvMatrixStack.pop();

        //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


        // lighting and materials for the third egg
        materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialDiffuse = vec4( 219/255, 207/255, 156/255, 1.0);
        materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
        materialShiness=50;
        SetupLightingMaterial();

        //egg3
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.7, 0.72, 0.63);
	modelViewMatrix=mult(modelViewMatrix, t);
        DrawEgg(0.015, 0.025, eggMov3);
	modelViewMatrix=mvMatrixStack.pop();

        gl.uniform1i(gl.getUniformLocation(program, "texture"), 4);
        gl.uniform1i(gl.getUniformLocation(program, "textureFlag"), 2);

        //cloud 1
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.2, 0.75, 0.8);
	modelViewMatrix=mult(modelViewMatrix, t);
        DrawCloud();
	modelViewMatrix=mvMatrixStack.pop();

        //cloud 2
    	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.3, 0.95, 0.3);
	modelViewMatrix=mult(modelViewMatrix, t);
        DrawCloud();
	modelViewMatrix=mvMatrixStack.pop();
	
	 gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
	DrawOranges();
	
    requestAnimFrame(render);
}

// ******************************************
// supporting functions below this:
// ******************************************

// a 4x4 matrix multiple by a vec4
function multiply(m, v)
{
    var vv=vec4(
     m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2]+ m[0][3]*v[3],
     m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2]+ m[1][3]*v[3],
     m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]+ m[2][3]*v[3],
     m[3][0]*v[0] + m[3][1]*v[1] + m[3][2]*v[2]+ m[3][3]*v[3]);
    return vv;
}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}

function triangle(a, b, c) 
{
     normalsArray.push(vec3(a[0], a[1], a[2]));
     normalsArray.push(vec3(b[0], b[1], b[2]));
     normalsArray.push(vec3(c[0], c[1], c[2]));
     
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
	 
    texCoordsArray.push(texCoord[0]);
    texCoordsArray.push(texCoord[1]);
    texCoordsArray.push(texCoord[2]);


     sphereCount += 3;
}

function divideTriangle(a, b, c, count) 
{
    if ( count > 0 ) 
    {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) 
{
    	divideTriangle(a, b, c, n);
    	divideTriangle(d, c, b, n);
    	divideTriangle(a, d, b, n);
    	divideTriangle(a, c, d, n);
}

// a, b, c, and d are all vec4 type
function quad(a, b, c, d) 
{
	var points=[a, b, c, d];
   	var normal = Newell(points);

    // triangle abc
   	pointsArray.push(a);
   	normalsArray.push(normal);
	texCoordsArray.push(texCoord[0]);
   	pointsArray.push(b);
   	normalsArray.push(normal);
	texCoordsArray.push(texCoord[1]);
   	pointsArray.push(c);
   	normalsArray.push(normal);
	texCoordsArray.push(texCoord[2]);

    // triangle acd
   	pointsArray.push(a);
   	normalsArray.push(normal);
	texCoordsArray.push(texCoord[0]);
   	pointsArray.push(c);
   	normalsArray.push(normal);
	texCoordsArray.push(texCoord[2]);
   	pointsArray.push(d);
   	normalsArray.push(normal);  
	texCoordsArray.push(texCoord[3]);

}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}

function Newell(vertices)
{
   var L=vertices.length;
   var x=0, y=0, z=0;
   var index, nextIndex;

   for (var i=0; i<L; i++)
   {
       index=i;
       nextIndex = (i+1)%L;
       
       x += (vertices[index][1] - vertices[nextIndex][1])*
            (vertices[index][2] + vertices[nextIndex][2]);
       y += (vertices[index][2] - vertices[nextIndex][2])*
            (vertices[index][0] + vertices[nextIndex][0]);
       z += (vertices[index][0] - vertices[nextIndex][0])*
            (vertices[index][1] + vertices[nextIndex][1]);
   }

   return (normalize(vec3(x, y, z)));
}

function polygon(vertices)
{
    var L=vertices.length;
    var normal=Newell(vertices);

    var prev=1;
    var next=2;
    // triangles:
    // a-b-c
    // a-c-d
    // a-d-e
    // ...
    for (var i=0; i<L-2; i++)
    {
        pointsArray.push(vertices[0]);
        normalsArray.push(normal);
        texCoordsArray.push(texCoord[0]);

        pointsArray.push(vertices[prev]);
        normalsArray.push(normal);
	texCoordsArray.push(texCoord[1]);

        pointsArray.push(vertices[next]);
        normalsArray.push(normal);
	texCoordsArray.push(texCoord[2]);

        cylinderCount += 3;
        prev=next;
        next=next+1;
    }
}


function pentagon(a, b, c, d, e) {

     var vertices = [a, b, c, d, e];
     var normal = Newell(vertices);

     pointsArray.push(a); 
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[0]);
     pointsArray.push(b); 
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[1]);
     pointsArray.push(c); 
     normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);

     pointsArray.push(a);
     normalsArray.push(normal); 
    texCoordsArray.push(texCoord[0]);
     pointsArray.push(c); 
     normalsArray.push(normal); 
    texCoordsArray.push(texCoord[2]);
     pointsArray.push(d); 
     normalsArray.push(normal);
    texCoordsArray.push(texCoord[3]);

     pointsArray.push(a);
     normalsArray.push(normal); 
    texCoordsArray.push(texCoord[0]);
     pointsArray.push(d); 
     normalsArray.push(normal);
    texCoordsArray.push(texCoord[3]);
     pointsArray.push(e); 
     normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);
} 

function SetupLightingMaterial()
{
    // set up lighting and material
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	// send lighting and material coefficient products to GPU
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
}


function loadTexture(texture, whichTexture)
{
    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Enable texture unit 1
    gl.activeTexture(whichTexture);

    // bind the texture object to the target
    gl.bindTexture( gl.TEXTURE_2D, texture);

    // set the texture image
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

    // set the texture parameters
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function EstablishTextures()
{
    // ========  Establish Textures =================
    // --------create texture object 1----------
    twigTexture = gl.createTexture();

    // create the image object
    twigTexture.image = new Image();

    // Tell the broswer to load an image
    //twigTexture.image.crossOrigin = "Anonymous";
    twigTexture.image.src='twig_texture.jpg';

    // register the event handler to be called on loading an image
    twigTexture.image.onload = function() {  loadTexture(twigTexture, gl.TEXTURE0); }

    // -------create texture object 2------------
    orangeTexture = gl.createTexture();

    // create the image object
    orangeTexture.image = new Image();

    // Tell the broswer to load an image
	//orangeTexture.image.crossOrigin = "anonymous";
    orangeTexture.image.src='orange_texture.jpg';

    // register the event handler to be called on loading an image
    orangeTexture.image.onload = function() {  loadTexture(orangeTexture, gl.TEXTURE1); }
	
	// -------create texture object 3------------
	grassTexture = gl.createTexture();

    // create the image object
    grassTexture.image = new Image();

    // Tell the broswer to load an image
    grassTexture.image.src='grass_texture.jpg';

    // register the event handler to be called on loading an image
    grassTexture.image.onload = function() {  loadTexture(grassTexture, gl.TEXTURE2); }
	
	// -------create texture object 4------------
	leafTexture = gl.createTexture();

    // create the image object
    leafTexture.image = new Image();

    // Tell the broswer to load an image
    leafTexture.image.src='leaves_texture.jpg';

    // register the event handler to be called on loading an image
    leafTexture.image.onload = function() {  loadTexture(leafTexture, gl.TEXTURE3); }


            	// -------create texture object 4------------
    cloudTexture = gl.createTexture();

    // create the image object
    cloudTexture.image = new Image();

    // Tell the broswer to load an image
    cloudTexture.image.src='cloud_texture.jpg';

    // register the event handler to be called on loading an image
    cloudTexture.image.onload = function() {  loadTexture(cloudTexture, gl.TEXTURE4); }


            	// -------create texture object 4------------
    skyTexture = gl.createTexture();

    // create the image object
    skyTexture.image = new Image();

    // Tell the broswer to load an image
    skyTexture.image.src='sky_texture.jpg';

    // register the event handler to be called on loading an image
    skyTexture.image.onload = function() {  loadTexture(skyTexture, gl.TEXTURE5); }

            	// -------create texture object 4------------
    whiteTexture = gl.createTexture();

    // create the image object
    whiteTexture.image = new Image();

    // Tell the broswer to load an image
    whiteTexture.image.src='white.jpg';

    // register the event handler to be called on loading an image
    whiteTexture.image.onload = function() {  loadTexture(whiteTexture, gl.TEXTURE6); }
}

