'use strict';
function target_pe(body, velocity_craft_planetS, intercept_angle, pe, crossing_ahead_of_body){
  pe += body.radius;
  var semi_major_axis = -body.gravitationalParameter / (velocity_craft_planetS * velocity_craft_planetS);
  var eccentricity = 1 - (pe / semi_major_axis);
  var impact_parameter = semi_major_axis * Math.sqrt( eccentricity * eccentricity - 1 );
  if( !crossing_ahead_of_body ) impact_parameter = -impact_parameter;
  var miss_distance = impact_parameter / Math.sin( intercept_angle );
  return {
    semi_major_axis: semi_major_axis,
    eccentricity: eccentricity,
    impact_parameter: impact_parameter,
    miss_distance: miss_distance
  };
}

var TWO_PI = Math.PI;
var R2D = 180 / Math.PI;
var SOLAR_HYPER_MAX_R = 3.4e11; // 1.7e11 ~ 1.5x Ap of Eeloo; 2.3e11 2x; 3.4e11 3x
var DRAWING_ANGULAR_STEP = 1 * Math.PI/180;

Orbit.prototype.positionAt = function(t) {
  var pos = this.positionAtTrueAnomaly( this.trueAnomalyAt( t ) );
  return pos;
  //return [pos[0], pos[2]];
};

/**
 * Calculates one of the two true anomoalies at the given radius. the other tA 
 * is simply the negative of the value returned by this function.
 * @param   {[[Type]]} radius [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
Orbit.prototype.trueAnomalyAtRadius = function(radius){
  // Equation 4.82
  var n = this.semiMajorAxis * ( 1 - this.eccentricity * this.eccentricity ) - radius;
  var d = this.eccentricity * radius;
  var k = n / d;
  if( k >= 1 ) return 0;
  if( k <= -1 ) return Math.PI;
  return Math.acos( k );
};



function walk_range( first, last, stride, callback, inclusive_of_last ){
  var steps = Math.ceil( ( last - first ) / stride );
  for( var i = 0; i < steps; ++i ) {
    callback( first + stride * i, i );
  }
  if( inclusive_of_last ) callback( last, i );
}

function interval( i0, i1, steps, cb ){
  var di = (i1 - i0) / steps;

  cb( i0, i );
  for( var i = 1; i < steps; ++ i ) {
    cb( i0 + di * i, i );
  }
  cb( i1, steps );
}

/**
 * Draw Hyperbolic Orbit
 * @param {CanvasRenderingContext2D}   ctx canvas drawing context
 * @param {Orbit}    orbit
 * @param {Array.<Number>} primary_pos
 */
function draw_hyper_orbit(ctx, orbit, primary_pos){
  if( orbit.eccentricity < 1 )
    throw new Error( "Given orbit was not Hyperbolic or Parabolic" );
  if( !primary_pos ) primary_pos = [0,0,0];
  var true_anomaly_at_soi = orbit.trueAnomalyAtRadius( orbit.referenceBody.sphereOfInfluence || SOLAR_HYPER_MAX_R );
  var rounded_ture_anomaly_at_soi = (true_anomaly_at_soi / DRAWING_ANGULAR_STEP |0) * DRAWING_ANGULAR_STEP;
  var pos;
  ctx.beginPath();
  pos = orbit.positionAtTrueAnomaly( -true_anomaly_at_soi );
  ctx.moveTo( primary_pos[0] + pos[0], primary_pos[1] + pos[1] );
  walk_range(-rounded_ture_anomaly_at_soi, rounded_ture_anomaly_at_soi, DRAWING_ANGULAR_STEP, function( ta, i ) {
    var pos = orbit.positionAtTrueAnomaly( ta );
    ctx.lineTo( primary_pos[0] + pos[0], primary_pos[1] + pos[1] );
  }, true );
  pos = orbit.positionAtTrueAnomaly( true_anomaly_at_soi );
  ctx.lineTo( primary_pos[0] + pos[0], primary_pos[1] + pos[1] );
  ctx.stroke();
}
/**
 * [[Description]]
 * @param {CanvasRenderingContext2D}   ctx canvas drawing context
 * @param {Orbit}    orbit
 * @param {Array.<Number>} primary_pos
 */
function draw_non_hyper_orbit(ctx, orbit, primary_pos){
  if( orbit.eccentricity >= 1 )
    throw new Error( "Given orbit was not Circular or Elliptical" );
  if( !primary_pos ) primary_pos = [0,0,0];
  ctx.beginPath();
  walk_range(-Math.PI, Math.PI, DRAWING_ANGULAR_STEP, function( ta, i ) {
    var pos = orbit.positionAtTrueAnomaly( ta );
    var x = (primary_pos[0] + pos[0]);
    var y = (primary_pos[1] + pos[1]);
    if( i > 0 ) ctx.lineTo( x, y );
    else ctx.moveTo( x, y );
  }, false );
  ctx.closePath();
  ctx.stroke();
}

/**
 * [[Description]]
 * @param {CanvasRenderingContext2D}   ctx canvas drawing context
 * @param {Orbit}    orbit
 * @param {Array.<Number>} primary_pos
 * @param {String} color       [[Description]]
 * @param {Number} line_weight [[Description]]
 */
function draw_orbit(ctx, orbit, primary_pos, color, line_weight) {
  ctx.save();
  if( line_weight ) ctx.lineWidth = line_weight;
  if( color ) ctx.strokeStyle = color;
  if( orbit.eccentricity < 1 )
    draw_non_hyper_orbit(ctx, orbit, primary_pos);
  else
    draw_hyper_orbit(ctx, orbit, primary_pos);
  ctx.restore();
}

var ps_body_colors = {
  Kerbol: "rgb(255,225,180)",
  Moho: "rgb(124,102,88)",
  Eve: "rgb(104,76,141)",
  Gilly: "rgb(134,119,103)",
  Kerbin: "rgb(73,99,121)",
  Mun: "rgb(80,82,81)",
  Minmus: "rgb(187,253,228)",
  Duna: "rgb(165,72,41)",
  Ike: "rgb(64,64,64)",
  Dres: "rgb(128,128,128)",
  Jool: "rgb(117,173,78)",
  Laythe: "rgb(88,92,106)",
  Vall: "rgb(140,158,160)",
  Tylo: "rgb(188,180,168)",
  Bop: "rgb(100,86,76)",
  Pol: "rgb(238,206,152)",
  Eeloo: "rgb(200,205,201)",
};

var map_body_colors = {
  Kerbol: "#ffffde",
  Moho: "#cea682",
  Eve: "#d942fe",
  Gilly: "#a48070",
  Kerbin: "#94d8d0",
  Mun: "#b7bed3",
  Minmus: "#8f749f",
  Duna: "#fe8050",
  Ike: "#d7e0f1",
  Dres: "#5a4632",
  Jool: "#bafe32",
  Laythe: "#44569c",
  Vall: "#defdfd",
  Tylo: "#d8aeae",
  Bop: "#baa07e",
  Pol: "#dee4ac",
  Eeloo: "#676767",
}

var map_minimum_safe_altitude = {
  Moho: 6818,
  Eve: 90000,
  Gilly: 6400,
  Kerbin: 70000,
  Mun: 7048,
  Minmus: 5725,
  Duna: 50000,
  Ike: 12721,
  Dres: 5670,
  Jool: 200000,
  Laythe: 50000,
  Vall: 7990,
  Tylo: 11283,
  Bop: 21747,
  Pol: 5591,
  Eeloo: 3874
}

var redraw_me;
function redraw_me_shadow(){
  if( redraw_me ) redraw_me();
  else console.warn("redraw_me is not set!");
}

var redraw_me_body;
function redraw_me_body_shadow(){
  if( redraw_me_body ) redraw_me_body();
  else console.warn("redraw_me_body is not set!");
}

function init_canvas( selector, draw_handler, enable_mouse_zoom ) {
  var $canvas = $(selector);
  var canvas = $canvas.get(0).getContext("2d");
  canvas.width = parseInt($canvas.attr("width"),10);
  canvas.height = parseInt($canvas.attr("height"),10);

  if(enable_mouse_zoom)
    canvas_helpers.enable_mouse_zoom( $canvas.get(0), canvas, draw_handler );
  else
    canvas_helpers.track_transforms(canvas);
  
  canvas.translate( (canvas.width / 2|0) + 0.5, (canvas.height / 2|0) + 0.5 );
  canvas.scale(1,-1);
  
  
  (function(ctx){
    // text 
    var fillText = ctx.fillText;
    ctx.fillText2 = function( text, x_world, y_world, x_screen_offset, y_screen_offset ) {
      var xy = ctx.untransformedPoint(x_world, y_world);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      fillText.call(ctx, text, xy.x + (x_screen_offset || 0), xy.y + (y_screen_offset || 0));
      ctx.restore();
    };

    var strokeText = ctx.strokeText;
    ctx.strokeText = function( text, x_world, y_world, x_screen_offset, y_screen_offset ) {
      var xy = ctx.untransformedPoint(x_world, y_world);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      strokeText.call(ctx, text, xy.x + (x_screen_offset || 0), xy.y + (y_screen_offset || 0));
      ctx.restore();
    };

    var arc = ctx.arc;
    ctx.arc2 = function(x_world, y_world, radius_screen, startAngle, endAngle, counterclockwise) {
      var xy = ctx.untransformedPoint(x_world, y_world);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      arc.call( ctx, xy.x, xy.y, radius_screen, startAngle, endAngle, counterclockwise );
      ctx.restore();
    };

    ctx.circle = function( x, y, radius ) {
      arc.call( ctx, x, y, radius, 0, Math.PI * 2 );
    };

    ctx.circle2 = function( x_world, y_world, radius_screen ) {
      var xy = ctx.untransformedPoint(x_world, y_world);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      arc.call( ctx, xy.x, xy.y, radius_screen, 0, Math.PI * 2 );
      ctx.restore();
    };

    var rect = ctx.rect;
    ctx.rect2 = function(x_center_world, y_center_world, w_screen, h_screen) {
      var xy = ctx.untransformedPoint(x_center_world, y_center_world);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      return rect.call( ctx, xy.x - w/2, xy.y - h/2, w_screen, h_screen );
      ctx.restore();
    }; 

    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var pt = svg.createSVGPoint();
    ctx.untransformedPoint = function(x,y){
      if( ctx.getTransformMatrix ) {
        var m = ctx.getTransformMatrix();
        return matrix.transformPoint(m, x, y);
      } else {
        var xform = ctx.getTransform();
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform);
      }
    }
  //    ctx.untransformLength = function( l ){
  //      var zero = ctx.untransformedPoint(0, 0);
  //      var xy = ctx.untransformedPoint(l, 0);
  //      xy.x -= zero.x;
  //      xy.y -= zero.y;
  //      var k;
  //      if( xy.y == 0 ) k = xy.x;
  //      else k = Math.sqrt( xy.x * xy.x + xy.y * xy.y );
  //      return k;
  //    }
    function transformLength( l ){
      return l / ctx.getTransform().a;
    }

    var stroke = ctx.stroke;
    ctx.stroke = function() {
      var lo = ctx.lineWidth;
      var l = transformLength( ctx.lineWidth );
      if( l < 0 ) l = -l;
      ctx.lineWidth = l;
      stroke.call(ctx);
      ctx.lineWidth = lo;
    }
    ctx.strokeAtScale = function() {
      stroke.call(ctx);
    }

    ctx.clear = function(){
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,ctx.width, ctx.height);
      ctx.restore();
    }

  })(canvas);
  
  return canvas;
}

var canvas = init_canvas( "#board", redraw_me_shadow, true );
var body_canvas = init_canvas( "#destination-body", redraw_me_body_shadow, true );

canvas.scale( 1/300000000,  1/300000000 );



function drawBodyAt( body, t, primary_pos, show_labels, no_orbit ) {
  show_labels = !!show_labels;
  if( !primary_pos ) primary_pos = [0,0,0];

  var pos = body.orbit.positionAt( t );
  if( !no_orbit ) draw_orbit( canvas, body.orbit, primary_pos, map_body_colors[body.name()], 0.5 );
  var x = (primary_pos[0] + pos[0]);
  var y = (primary_pos[1] + pos[1]);

  canvas.save();

  // Draw Planetary body marker (to scale)
  canvas.beginPath();
  canvas.circle( x, y, body.radius );
  canvas.fillStyle = map_body_colors[body.name()];
  canvas.fill();

  // Draw SOI (to scale)
  canvas.beginPath();
  canvas.circle( x, y, body.sphereOfInfluence );
  canvas.strokeStyle = ps_body_colors[body.name()];
  canvas.stroke();

  drawChildrenAt(t, body, pos, false);

  if( show_labels ) {
    canvas.fillStyle = 'black';
    canvas.textAlign = "center";
    canvas.fillText2(body.name(), x, y);
  }
  canvas.restore(); 
}

function drawChildrenAt(t, primary, primary_pos, show_labels) {
  show_labels = !!show_labels;
  for( var child_name in primary.children() ) {
    var body = CelestialBody[child_name];
    draw_orbit( canvas, body.orbit, primary_pos, map_body_colors[child_name], 0.5 );

    canvas.save();
    
    var pos = body.orbit.positionAt( t );
    var x = (primary_pos[0] + pos[0]);
    var y = (primary_pos[1] + pos[1]);

    // Draw Planetary body marker (to scale)
    canvas.beginPath();
    canvas.circle( x, y, body.radius );
    canvas.fillStyle = map_body_colors[child_name];
    canvas.fill();

    // Draw SOI (to scale)
    canvas.beginPath();
    canvas.circle( x, y, body.sphereOfInfluence );
    canvas.strokeStyle = ps_body_colors[child_name];
    canvas.stroke();

    var m = canvas.getTransformMatrix();
    // using Mun SOI as an arbitrary ruler
    var soi_screen_width = 2 * vector.magnitude(vector.sub(matrix.transformPoint(m, [0,0]), matrix.transformPoint(m, [CelestialBody.Mun.sphereOfInfluence,0])));
    drawChildrenAt(t, body, pos, soi_screen_width >= 10);

    if( show_labels ) {
      canvas.fillStyle = "black";
      canvas.textAlign = "center";
      canvas.textBaseline = "middle"
      canvas.fillText2(child_name, x, y);
    }
    canvas.restore(); 
  } 
}

/**
 * draws the solar system at a given time
 * @param {Number} t epoch
 */
function drawAt(t) {
  //console.log("\n------------------ DRAW ------------------\n");
  canvas.clear();

  // draw the sun (Kerbol) at exaggerated scale
  canvas.save();
  canvas.beginPath();
  canvas.circle( 0, 0, CelestialBody.Kerbol.radius * 4 );
  canvas.fillStyle = ps_body_colors.Kerbol;
  canvas.fill();
  canvas.beginPath();
  canvas.circle( 0, 0, CelestialBody.Kerbol.radius * 3 );
  canvas.fillStyle = map_body_colors.Kerbol;
  canvas.fill();
  canvas.restore(); 
  
  drawChildrenAt( t, CelestialBody.Kerbol, [0,0,0], true );
  
  var k = new KerbalTime(t)
  $("#time").text( k.toDateString() );
}


function newHelioTrajectory( j ) {
  //  semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch, timeOfPeriapsisPassage)
  return new Orbit( 
    CelestialBody.Kerbol, 
    j.semiMajorAxis,
    j.eccentricity,
    j.inclination,
    j.longitudeOfAscendingNode * 180 / Math.PI,
    j.argumentOfPeriapsis * 180 / Math.PI,
    j.meanAnomalyAtEpoch,
    j.timeOfPeriapsisPassage * 180 / Math.PI
  );
} 


var trajectory;
var encounter;





function newTransferOrbit( primary, params ) {
  return new Orbit( 
    primary, 
    params.semiMajorAxis,
    params.eccentricity,
    params.inclination,
    params.longitudeOfAscendingNode * 180 / Math.PI,
    params.argumentOfPeriapsis * 180 / Math.PI,
    params.meanAnomalyAtEpoch,
    params.timeOfPeriapsisPassage * 180 / Math.PI
  );
}


function angleBetween( p0, p1 ){
  var angle = Math.acos(numeric.dotVV(p0, p1) / (numeric.norm2(p0) * numeric.norm2(p1)));
  if (p0[0] * p1[1] - p0[1] * p1[0] < 0) {
    angle = 2 * Math.PI - angle;
  }
  return angle;
}


var orbit_flyby;
function drawPatch(orbit, primary_pos, color, line_weight, t0, t1, origin, destination, destination_pe) {
  if( !primary_pos ) primary_pos = [0,0,0];
  if( !color ) color = "blue";
  line_weight = line_weight || 2;

  var origin_pos = origin.orbit.positionAt( t0 );
  var destination_pos = destination.orbit.positionAt( t1 );

  var origin_true_anomaly = orbit.trueAnomalyAtPosition(origin_pos);
  var destination_true_anomaly = orbit.trueAnomalyAtPosition(destination_pos);

  var origin_t = orbit.timeAtTrueAnomaly( origin_true_anomaly );
  var destination_t = orbit.timeAtTrueAnomaly( destination_true_anomaly );
  while( destination_t < origin_t ) {
    destination_t += orbit.period();
  }

  /// EXPERIMENT ===>
  
  if( true ) {
    var temp1, temp2, p;
    encounter = {
      initial: {
        primary: destination.orbit.referenceBody,
      },
      within_soi: {
        primary: destination,
      },
      departure: {},
    };
    var mu = destination.gravitationalParameter;
    var velocity_craft_sunV = encounter.initial.velocity_craft = orbit.velocityAtTrueAnomaly( destination_true_anomaly );
    var velocity_planet_sunV = encounter.initial.velocity_planet = destination.orbit.velocityAtTrueAnomaly( destination.orbit.trueAnomalyAtPosition(destination_pos) );
//    console.log( "velocity_craft_sunV", velocity_craft_sunV, vector.magnitude(velocity_craft_sunV) );
    //console.log( "velocity_planet_sunV", velocity_planet_sunV, vector.magnitude(velocity_planet_sunV) );
    //console.log( "craft -> planet angle", vector.angleBetween(velocity_craft_sunV, velocity_planet_sunV, [0,0,1]) * R2D );
    
    var velocity_craft_planet_soloarV = encounter.initial.velocity_craft_planet = vector.sub( velocity_craft_sunV, velocity_planet_sunV );
//    console.log( "velocity_craft_planet_soloarV", velocity_craft_planet_soloarV, vector.magnitude(velocity_craft_planet_soloarV) );
    
    // when we run craft and planet velocities through this matrix their Z values will be zero. This allows for 2D turning calculations to be used
    var intercept_z_matrix = matrix.rotatationToZPlane( velocity_craft_sunV, velocity_planet_sunV );
    
    // and what the heck, we might as well rotate the frame so the planet velocity is aligned with the x-axis
    var twist = matrix.transformPoint( intercept_z_matrix, velocity_planet_sunV );
    //console.log( "twist", twist, vector.angleBetween(twist, [1,0,0], [0,0,1]) * R2D );
    intercept_z_matrix = matrix.mul(
      matrix.new_rotation4( vector.angleBetween([1,0,0], twist, [0,0,1]) ),
      intercept_z_matrix
    );
    
    var velocity_craftV = encounter.within_soi.initial_velocity_craft = matrix.transformPoint( intercept_z_matrix, velocity_craft_sunV );
    var velocity_planetV = encounter.within_soi.velocity_planet = matrix.transformPoint( intercept_z_matrix, velocity_planet_sunV );
//    console.log( "velocity_craftV (flattened plane)", velocity_craftV, vector.magnitude(velocity_craftV), vector.angleBetween(velocity_craftV, [1,0,0], [0,0,1]) * R2D );
    //console.log( "velocity_planetV (flattened plane)", velocity_planetV, vector.magnitude(velocity_planetV), vector.angleBetween(velocity_planetV, [1,0,0], [0,0,1]) * R2D );
    //console.log( "craft -> planet angle (flattened plane)", vector.angleBetween(velocity_craftV, velocity_planetV, [0,0,1]) * R2D );
    
    
    
    var velocity_craft_planetV = encounter.within_soi.velocity_craft_planet = vector.sub( velocity_craftV, velocity_planetV );
    var velocity_craft_planetS = vector.magnitude( velocity_craft_planetV );
//    console.log( "velocity_craft_planetV", velocity_craft_planetV, vector.magnitude(velocity_craft_planetV) );
    
    //var intercept_angle = encounter.within_soi.intercept_angle = vector.angleBetween(velocity_planetV, velocity_craftV, [0,0,1]);
    var intercept_angle = encounter.within_soi.intercept_angle = Math.atan2(velocity_craft_planetV[1],velocity_craft_planetV[0]);
//    console.log( "intercept_angle", intercept_angle, intercept_angle * R2D );
    
//    // Equations (5.40) through (5.42)
//    var miss_distance = destination.radius * -20;
//    var impact_parameter = miss_distance * Math.sin( intercept_angle );
//    var semi_major_axis = -mu / (velocity_craft_planetS * velocity_craft_planetS);
//    var eccentricity = Math.sqrt( 1 + ((impact_parameter * impact_parameter) / (semi_major_axis * semi_major_axis)) );
//    
//    
//    console.log( "miss_distance", miss_distance );
//    console.log( "impact_parameter", impact_parameter );
//    console.log( "semi_major_axis", semi_major_axis );
//    console.log( "eccentricity", eccentricity );
    
    
//    var Pe = semi_major_axis * ( 1 - eccentricity );
//    console.log( "Pe (ASL)", (Pe - destination.radius)|0 );
//    
//    console.log( "PE REF", target_pe( destination, velocity_craft_planetS, intercept_angle, Pe - destination.radius, miss_distance > 0 ) );
    
    var pe_asl = destination_pe;  // map_minimum_safe_altitude[destination.name()] + 500;
    var Pe = pe_asl + destination.radius;
//    console.log( "Pe (ASL)", pe_asl );
    var flyby_arguments = target_pe( destination, velocity_craft_planetS, intercept_angle, pe_asl, false );
    var miss_distance = flyby_arguments.miss_distance;
    var impact_parameter = flyby_arguments.impact_parameter;
    var semi_major_axis = flyby_arguments.semi_major_axis;
    var eccentricity = flyby_arguments.eccentricity;
//    console.log( "flyby_arguments", flyby_arguments );
    // Equation (4.80)
    var turning_angle = 2 * Math.asin( 1 / eccentricity );  // always positive result
//    console.log( "turning_angle", turning_angle, turning_angle * R2D );
    
    
    
    // Equation (5.49) and then some
    var ejection_angle;
    var pe_angle;
    var turning_sign;
    if( miss_distance >= 0 ) {
      if( velocity_craft_planetV[1] < 0 ){
        ejection_angle = intercept_angle - turning_angle;
        pe_angle = (intercept_angle + Math.PI/2) - turning_angle/2;
        turning_sign = -1;
//        console.warn("A");
      }else{
        ejection_angle = intercept_angle + turning_angle;
        pe_angle = (intercept_angle - Math.PI/2) + turning_angle/2;
        turning_sign = 1;
//        console.warn("B");
      }
    } else {
      if( velocity_craft_planetV[1] >= 0 ){
        ejection_angle = intercept_angle - turning_angle;
        pe_angle = (intercept_angle + Math.PI/2) - turning_angle/2;
        turning_sign = -1;
//        console.warn("C");
      }else{
        ejection_angle = intercept_angle + turning_angle;
        pe_angle = (intercept_angle - Math.PI/2) + turning_angle/2;
        turning_sign = 1;
//        console.warn("D");
      }
    }
    var vector_to_pe = vector.rotateZ( [Pe,0,0], pe_angle );
    var velocity_at_peS = Math.sqrt( destination.gravitationalParameter * (2/Pe - 1/semi_major_axis) );  // Equation 4.45
    var velocity_at_peV = vector.scale(vector.normalize(vector.rotateZ(vector_to_pe, turning_sign * 90, true)), velocity_at_peS);
    
    //console.log( "ejection_angle", ejection_angle, ejection_angle * R2D );
    //console.log( "pe_angle", pe_angle, pe_angle * R2D );
    
    
    var ejection_vector = vector.rotateZ( [velocity_craft_planetS,0,0], ejection_angle );
    //console.log( "ejection_vector (planet frame)", ejection_vector );
    
    var m = matrix.inverse( intercept_z_matrix );
    var craft_escape_vector_plant_frame = vector.add( ejection_vector, velocity_planetV )
    var craft_escape_vector_sun_frame = matrix.transformPoint( m, craft_escape_vector_plant_frame );
    //console.log( "initial", velocity_craft_sunV, vector.magnitude(velocity_craft_sunV) );
//    console.log( "final helio velocity", craft_escape_vector_sun_frame, vector.magnitude(craft_escape_vector_sun_frame) );
    
    
    
    redraw_me_body = function(){
      body_canvas.clear();
      body_canvas.save(); try{
      body_canvas.scale( 1/ 100000,  1/ 100000 );
      
      
      body_canvas.beginPath();
      body_canvas.circle( 0, 0, destination.radius );
      body_canvas.fillStyle = "gray";
      body_canvas.fill();
      
      // draw polar axis visualization aid
      body_canvas.save();
        var north_pole = matrix.transformPoint(intercept_z_matrix, [0,0,destination.radius]);
        var south_pole = matrix.transformPoint(intercept_z_matrix, [0,0,-destination.radius]);
      
        if( north_pole[2] > south_pole[2] ){
          body_canvas.beginPath();
          body_canvas.circle(south_pole[0], south_pole[1], destination.radius * 0.1);
          body_canvas.fillStyle = "rgb(64,64,64)";
          body_canvas.fill();
          
          body_canvas.beginPath();
          body_canvas.moveTo(south_pole[0], south_pole[1]);
          body_canvas.lineTo(north_pole[0], north_pole[1]);
          body_canvas.strokeStyle = "#606060";
          body_canvas.lineWidth = destination.radius * 0.15;
          body_canvas.lineCap = "round";
          body_canvas.strokeAtScale();
          
          body_canvas.beginPath();
          body_canvas.circle(north_pole[0],north_pole[1], destination.radius * 0.1);
          body_canvas.fillStyle = "rgb(191,191,191)";
          body_canvas.fill();
        } else {
          body_canvas.beginPath();
          body_canvas.circle(north_pole[0],north_pole[1], destination.radius * 0.1);
          body_canvas.fillStyle = "rgb(191,191,191)";
          body_canvas.fill();
          
          body_canvas.beginPath();
          body_canvas.moveTo(north_pole[0], north_pole[1]);
          body_canvas.lineTo(south_pole[0], south_pole[1]);
          body_canvas.strokeStyle = "#606060";
          body_canvas.lineWidth = destination.radius * 0.15;
          body_canvas.lineCap = "round";
          body_canvas.strokeAtScale();
          
          body_canvas.beginPath();
          body_canvas.circle(south_pole[0],south_pole[1], destination.radius * 0.1);
          body_canvas.fillStyle = "rgb(64,64,64)";
          body_canvas.fill();
        } 
      body_canvas.restore();
      
      body_canvas.save();
        body_canvas.lineWidth = 1;
        body_canvas.globalAlpha = 0.2;

        body_canvas.beginPath();
        body_canvas.circle( 0, 0, Math.abs(impact_parameter) );
        body_canvas.strokeStyle = "black";
        body_canvas.stroke();

        body_canvas.beginPath();
        body_canvas.circle( 0, 0, Pe );
        body_canvas.strokeStyle = "pink";
        body_canvas.stroke();

        body_canvas.beginPath();
        body_canvas.circle( 0, 0, destination.sphereOfInfluence );
        body_canvas.strokeStyle = "red";
        body_canvas.stroke();
      body_canvas.restore();
      
      body_canvas.beginPath();
      body_canvas.moveTo(-destination.sphereOfInfluence * 2,0);
      body_canvas.lineTo(destination.sphereOfInfluence * 2, 0);
      body_canvas.strokeStyle = "rgba(0,0,0,.2)";
      body_canvas.stroke();
      
      
      var asymptote_points = [];
      var asymptote_crossing_pos = intersection_of_lines([0,0,0], vector_to_pe, [miss_distance,0,0], velocity_craft_planetV);
      asymptote_points[1] = asymptote_crossing_pos;
      
      var crossings = intersection_directed_ray_circle_2d([0,0], destination.sphereOfInfluence, asymptote_crossing_pos.slice(0,2), vector.scale(velocity_craft_planetV.slice(0,2), -1));
      if( crossings.length == 0 )
        throw new Error("BOOM");
      asymptote_points[0] = crossings[0];

      body_canvas.font = "bold 10px sans-serif";
      body_canvas.textBaseline = "middle";
      body_canvas.textAlign = "center";
      body_canvas.globalAlpha = 0.2;
      body_canvas.beginPath();
      body_canvas.moveTo(asymptote_crossing_pos[0], asymptote_crossing_pos[1]);
      body_canvas.lineTo(crossings[0][0], crossings[0][1]);
      body_canvas.strokeStyle = "blue";
      body_canvas.stroke();
      
      body_canvas.globalAlpha = 1;
      var ttt = vector.scale( vector.normalize([crossings[0][0], crossings[0][1]]), 12 );
      body_canvas.fillStyle = "black";
      body_canvas.fillText2("IN", crossings[0][0], crossings[0][1], ttt[0], -ttt[1] );
      body_canvas.globalAlpha = 0.2;
      
      body_canvas.beginPath();
      body_canvas.moveTo(0,0);
      body_canvas.lineTo(vector_to_pe[0], vector_to_pe[1]);
      body_canvas.strokeStyle = "pink";
      body_canvas.stroke();
      
      
      crossings = intersection_directed_ray_circle_2d([0,0], destination.sphereOfInfluence, asymptote_crossing_pos.slice(0,2), ejection_vector.slice(0,2));
      asymptote_points[2] = crossings[0];
      body_canvas.beginPath();
      body_canvas.moveTo(asymptote_crossing_pos[0], asymptote_crossing_pos[1]);
      body_canvas.lineTo(crossings[0][0], crossings[0][1]);
      body_canvas.strokeStyle = "green";
      body_canvas.stroke();
      body_canvas.globalAlpha = 1;
      ttt = vector.scale( vector.normalize([crossings[0][0], crossings[0][1]]), 12 );
      body_canvas.fillStyle = "black";
      body_canvas.fillText2("OUT", crossings[0][0], crossings[0][1], ttt[0], -ttt[1] );

      var local_orbit = Orbit.fromPositionAndVelocity( destination, vector_to_pe, velocity_at_peV, destination_t );
      temp2 = local_orbit.trueAnomalyAtRadius( destination.sphereOfInfluence );
      
//      console.log( "position at pe (vector_to_pe)", vector_to_pe );
//      console.log( "velocity_at_pe", velocity_at_peV, velocity_at_peS );
//      console.log( "local_orbit", local_orbit );
//      console.log( "True Anomaly at Radius", temp2, temp2 * R2D );
      
      // Draw Hyperbolic Orbit Around Planet
      body_canvas.strokeStyle = "green";
      body_canvas.lineWidth = 2;
      draw_hyper_orbit(body_canvas, local_orbit);
      body_canvas.lineWidth = 1;
//      body_canvas.strokeStyle = "green";
//      body_canvas.beginPath();
//      for( var i = 0; i < temp2; i += 2 * Math.PI/180 ){
//        p = local_orbit.positionAtTrueAnomaly( i );
//
//        if( i > 0 )
//          body_canvas.lineTo(p[0], p[1]);
//        else
//          body_canvas.moveTo(p[0], p[1]);
//      }
//      p = local_orbit.positionAtTrueAnomaly( temp2 );
//      body_canvas.lineTo(p[0], p[1]);
//      body_canvas.stroke();
//      
//      body_canvas.strokeStyle = "blue";
//      body_canvas.beginPath();
//      for( var i = 0; i < temp2; i += 2 * Math.PI/180 ){
//        p = local_orbit.positionAtTrueAnomaly( -i );
//
//        if( i > 0 )
//          body_canvas.lineTo(p[0], p[1]);
//        else
//          body_canvas.moveTo(p[0], p[1]);
//      }
//      p = local_orbit.positionAtTrueAnomaly( -temp2 );
//      body_canvas.lineTo(p[0], p[1]);
//      body_canvas.stroke();

//      body_canvas.strokeStyle = "red";
//      body_canvas.beginPath();
//      body_canvas.moveTo(vector_to_pe[0], vector_to_pe[1]);
//      body_canvas.lineTo(vector_to_pe[0] + velocity_at_peV[0] * 100, vector_to_pe[1] + velocity_at_peV[1] * 100);
//      body_canvas.stroke();
      
      
      } finally { body_canvas.restore(); }
      // UCS icon
      (function(){
        var x_vector = matrix.transformPoint(intercept_z_matrix, [20,0,0])
        var y_vector = matrix.transformPoint(intercept_z_matrix, [0,20,0])
        var z_vector = matrix.transformPoint(intercept_z_matrix, [0,0,20])
        var t;
        body_canvas.save();
          body_canvas.font = "bold 10px sans-serif";
          body_canvas.textBaseline = "middle";
          body_canvas.textAlign = "center";
          body_canvas.translate( -body_canvas.width / 2 + 35, -body_canvas.height / 2 + 35);
        
          body_canvas.beginPath();
          body_canvas.moveTo(0,0);
          body_canvas.lineTo(x_vector[0], x_vector[1]);
          body_canvas.strokeStyle = "red";
          body_canvas.fillStyle = "red";
          body_canvas.stroke();
          t = vector.scale( vector.normalize([x_vector[0], x_vector[1]]), 8 );
          body_canvas.fillText2("X", x_vector[0], x_vector[1], t[0], -t[1] );
          
          body_canvas.beginPath();
          body_canvas.moveTo(0,0);
          body_canvas.lineTo(y_vector[0], y_vector[1]);
          body_canvas.strokeStyle = "green";
          body_canvas.fillStyle = "green";
          body_canvas.stroke();
          t = vector.scale( vector.normalize([y_vector[0], y_vector[1]]), 8 );
          body_canvas.fillText2("Y", y_vector[0], y_vector[1], t[0], -t[1] );
        
          body_canvas.beginPath();
          body_canvas.moveTo(0,0);
          body_canvas.lineTo(z_vector[0], z_vector[1]);
          body_canvas.strokeStyle = "blue";
          body_canvas.fillStyle = "blue";
          body_canvas.stroke();
          t = vector.scale( vector.normalize([z_vector[0], z_vector[1]]), 8 );
          body_canvas.fillText2("Z", z_vector[0], z_vector[1], t[0], -t[1] );
          
        body_canvas.restore();
      })();
      
    }
    redraw_me_body();
    
    orbit_flyby = Orbit.fromPositionAndVelocity( destination.orbit.referenceBody, destination_pos, craft_escape_vector_sun_frame, destination_t );
    if( false ) {
      console.log("-------------------");
      console.log("  primary", destination.orbit.referenceBody.name() );
      console.log("  destination_pos", destination_pos );
      console.log("  velocity vector", craft_escape_vector_sun_frame );
      console.log("  destination_t", destination_t );
      console.log("-------------------");
    }
    
  }
  /// <=== EXPERIMENT

  canvas.save();
  canvas.lineWidth = line_weight;
  canvas.textAlign = "center";
  canvas.textBaseline = "middle";
  canvas.fillStyle = color;
  canvas.strokeStyle = color;

  // Draw flight path
  draw_orbit( canvas, orbit, primary_pos, "blue", 1 );
  
  // Draw Orbital Points: Pe, Ap, AN, DN
  if( true ) {
    canvas.save();
    canvas.font = "bold 8px sans-serif";
    var marker_radius = 1.5;
    var text_offset = 0;  // 2 + marker_radius;
    var pos, x, y;

    canvas.beginPath();
    pos = orbit.positionAt(orbit.timeOfPeriapsisPassage);
    x = (primary_pos[0] + pos[0]);
    y = (primary_pos[1] + pos[1]);
    canvas.arc2( x, y, marker_radius, 0, Math.PI * 2 );
    canvas.fill();
    canvas.save();
    //canvas.fillStyle = "gray";
    //canvas.fillText2("Pe", x, y, 0, -text_offset);
    canvas.restore();

    canvas.beginPath();
    pos = orbit.positionAt(orbit.timeOfPeriapsisPassage + orbit.period() / 2);
    x = (primary_pos[0] + pos[0]);
    y = (primary_pos[1] + pos[1]);
    canvas.arc2( x, y, marker_radius, 0, Math.PI * 2 );
    canvas.fill();
    canvas.save();
    //canvas.fillStyle = "gray";
    //canvas.fillText2("Ap", x, y, 0, -text_offset);
    canvas.restore();

    if( false ){
      canvas.beginPath();
      var an = pos = orbit.positionAtTrueAnomaly( orbit.trueAnomalyAt( orbit.argumentOfPeriapsis ) );
      x = (primary_pos[0] + pos[0]);
      y = (primary_pos[1] + pos[1]);
      canvas.arc2( x, y, marker_radius, 0, Math.PI * 2 );
      canvas.fill();
      canvas.fillText2("AN", x, y, 0, -text_offset);

      canvas.beginPath();
      var dn = pos = orbit.positionAtTrueAnomaly( orbit.trueAnomalyAt( orbit.argumentOfPeriapsis ) + Math.PI );
      x = (primary_pos[0] + pos[0]);
      y = (primary_pos[1] + pos[1]);
      canvas.arc2( x, y, marker_radius, 0, Math.PI * 2 );
      canvas.fill();
      canvas.fillText2("DN", x, y, 0, -text_offset);

      // draw line between AN and DN
      canvas.beginPath();
      canvas.moveTo(primary_pos[0] + an[0], primary_pos[1] + an[1]);
      canvas.lineTo(primary_pos[0] + dn[0], primary_pos[1] + dn[1]);
      //canvas.setLineDash([3,2]);
      canvas.lineWidth = 0.1;
      canvas.stroke();
    }
    canvas.restore();
  }
  
  // Draw flyby path
  draw_orbit( canvas, orbit_flyby, primary_pos, "green", 1 );
  
  
  canvas.restore();
}




var demos = {
  Moho: {"originBody":"Kerbin","destinationBody":"Moho","referenceBody":"Kerbol","departureTime":5734800,"arrivalTime":8721216,"transferOrbit":{"semiMajorAxis":9843756430.54666,"eccentricity":0.3814633213603546,"timeOfPeriapsisPassage":2884764.2952238047,"inclination":0.0046367480861129766,"longitudeOfAscendingNode":3.9544509196143576,"argumentOfPeriapsis":6.23333268153194}},
  Eve: {"originBody":"Kerbin","destinationBody":"Eve","referenceBody":"Kerbol","departureTime":12636864,"arrivalTime":16922952,"transferOrbit":{"semiMajorAxis":11373936796.681204,"eccentricity":0.19577409650611657,"timeOfPeriapsisPassage":9080957.04527178,"inclination":0.0024794703676144195,"longitudeOfAscendingNode":2.3423067357815786,"argumentOfPeriapsis":6.260944954609306}},
  Eve2: {"originBody":"Kerbin","destinationBody":"Eve","referenceBody":"Kerbol","departureTime":13618368,"arrivalTime":18372312,"transferOrbit":{"semiMajorAxis":10644283863.214586,"eccentricity":0.3018378839965435,"timeOfPeriapsisPassage":10960689.550978169,"inclination":0.03900529946208253,"longitudeOfAscendingNode":6.153964220171446,"argumentOfPeriapsis":3.4385190773869394}},
  Duna: {"originBody":"Kerbin","destinationBody":"Duna","referenceBody":"Kerbol","departureTime":4968864,"arrivalTime":10404864,"transferOrbit":{"semiMajorAxis":16851700747.560364,"eccentricity":0.19303147708820514,"timeOfPeriapsisPassage":4927471.686051534,"inclination":0.0020730382045537595,"longitudeOfAscendingNode":0.24901789874579075,"argumentOfPeriapsis":6.252318031478111}},
  Dres: {"originBody":"Kerbin","destinationBody":"Dres","referenceBody":"Kerbol","departureTime":20856960.000000004,"arrivalTime":33718896,"transferOrbit":{"semiMajorAxis":26781610114.433323,"eccentricity":0.4925679021649743,"timeOfPeriapsisPassage":-4496764.088833563,"inclination":0.0016685171706053534,"longitudeOfAscendingNode":1.6709143865526188,"argumentOfPeriapsis":3.20833190748152}},
  Jool: {"originBody":"Kerbin","destinationBody":"Jool","referenceBody":"Kerbol","departureTime":14722560,"arrivalTime":49479840,"transferOrbit":{"semiMajorAxis":44785867735.83286,"eccentricity":0.6963377799887899,"timeOfPeriapsisPassage":-40272451.18399882,"inclination":0.006761378681000239,"longitudeOfAscendingNode":3.7661945012317375,"argumentOfPeriapsis":3.1463897438205746}},
  Eeloo: {"originBody":"Kerbin","destinationBody":"Eeloo","referenceBody":"Kerbol","departureTime":14783904,"arrivalTime":55908144,"transferOrbit":{"semiMajorAxis":49491103057.1832,"eccentricity":0.7252127569821635,"timeOfPeriapsisPassage":14772169.454704743,"inclination":0.0004874712267817378,"longitudeOfAscendingNode":0.666480899566949,"argumentOfPeriapsis":6.272662762736749}},
};

var flights = {
//  Duna1: {
//    SMA: 18322058079.321,
//    ECC: 0.259088386253729,
//    INC: 0.0206782634656917,
//    LPE: 238.747219443874,
//    LAN: 136.052656130231,
//    MNA: 0.296333212872194,
//    EPH: 5638931.08300653,
//    REF: 0,
//  }
  Duna1: {
    "originBody": "Kerbin",
    "destinationBody": "Duna",
    "referenceBody": "Kerbol",
    "departureTime": 4785383,
    "arrivalTime": 8647900,
    "transferOrbit": {
      "semiMajorAxis": 18322058079.321,
      "eccentricity": 0.259088386253729,
      "timeOfPeriapsisPassage": 5638931.08300653,
      "inclination": 0.0206782634656917,
      "longitudeOfAscendingNode": 136.052656130231 * Math.PI/180,
      "argumentOfPeriapsis": 238.747219443874 * Math.PI/180
    }
  },

}

function scroll_into_view( ctx, pos ) {
  var m = ctx.getTransformMatrix();
  var center = matrix.transformPoint(matrix.inverse(m), [500.5,300.5]);
  var o = vector.sub( center, pos );
  
  ctx.translate( o[0], o[1] );
}

var primary_mission;
function alex( mission ) {
  primary_mission = mission;
  var k;
  redraw_me = function() {
    var primary = CelestialBody[mission.referenceBody];
    var primary_initial_pos = primary.orbit ? primary.orbit.positionAt( mission.departureTime ) : [0,0,0];
    var origin = CelestialBody[mission.originBody];
    var destination = CelestialBody[mission.destinationBody];
    trajectory = newTransferOrbit( primary, mission.transferOrbit );
    
    drawAt(mission.departureTime);
    //drawBodyAt( origin, mission.arrivalTime, primary_initial_pos, false);
    drawBodyAt( destination, mission.arrivalTime, primary_initial_pos, false, false );

    var destination_pe = $('#finalOrbit').val().trim() * 1e3;
    var min_pe = map_minimum_safe_altitude[destination.name()] + 500;
    if( !destination_pe || destination_pe < min_pe )
      destination_pe = min_pe;
    drawPatch( trajectory, primary_initial_pos, "blue", .5, mission.departureTime, mission.arrivalTime, origin, destination, destination_pe );
    //drawPatch( destination.orbit, primary_initial_pos, "red", 2, mission.departureTime, mission.arrivalTime );
    k = show_crossings(mission.departureTime);
  };
  (function(){
    var primary = CelestialBody[mission.referenceBody];
    if( primary.orbit ) {
      var primary_initial_pos = primary.orbit.positionAt( mission.departureTime );
      scroll_into_view( canvas, primary_initial_pos );
    }
  })();
  redraw_me();
  calculate_flyby_encounter_corrections(k);
}

//alex( demos.Eve );
//alex( flights.Duna1 )
redraw_me = function() {
  drawAt(0);
}
drawAt(0);

// Animate
if( false ) {
  drawAt(0);
  var time_now = 0;
  var timer_step = CelestialBody.Kerbin.orbit.period() / 50;
  timer_step /= 30;
  redraw_me = function(){ drawAt(time_now); }
  setInterval( function(){
    drawAt( time_now );
    time_now += timer_step;
  }, 20);
}

function mark(p, r, offset){
  if(!r) r = 4;
  if(!offset) offset = [0,0,0];
  canvas.beginPath();
  canvas.circle2( offset[0] + p[0], offset[1] + p[1], r );
  canvas.stroke() 
}

function orbit_intersections( A, B, time ){
  if( !A || !B ) return [];
  if( A.referenceBody != B.referenceBody ) throw new Error("Orbits must share the same primary - they do not");
  time = time || 0;
  var primary_initial_pos = A.referenceBody.orbit ? A.referenceBody.orbit.positionAt( time ) : [0,0,0];
//  if( A.periapsis() > B.periapsis() ){
//    var t = A;
//    A = B;
//    B = t;
//  }
  
  var min_ap = Math.min( A.apoapsis(), B.apoapsis() );
  var max_pe = Math.max( A.periapsis(), B.periapsis() );
  // orbits do not cross
  if( min_ap < max_pe ) return [];
  var Aaop = normalize_angle(A.argumentOfPeriapsis + A.longitudeOfAscendingNode);
  var Baop = normalize_angle(B.argumentOfPeriapsis + B.longitudeOfAscendingNode);
  
  
//  canvas.strokeStyle = "red";
//  canvas.beginPath();
//  canvas.circle(0,0,min_ap);
//  canvas.stroke();
//  canvas.beginPath();
//  canvas.circle(0,0,max_pe);
//  canvas.stroke();

//  var A_v_at_pe = A.argumentOfPeriapsis + A.longitudeOfAscendingNode
//  mark( A.positionAt(rot), 4, primary_initial_pos );
  
//  mark( A.positionAt(A.timeAtTrueAnomaly(0)), 4, primary_initial_pos );
//  mark( B.positionAt(B.timeAtTrueAnomaly(0)), 4, primary_initial_pos );
//  console.log( A.positionAt(A.timeAtTrueAnomaly(0)) );
//  console.log( B.positionAt(B.timeAtTrueAnomaly(0)) );
  
  var search_space_1 = [];
  var search_space_2 = [];
  search_space_1[0] = A.trueAnomalyAtRadius( min_ap );
  search_space_1[1] = A.trueAnomalyAtRadius( max_pe );
  search_space_2[0] = -search_space_1[0];
  search_space_2[1] = -search_space_1[1];
//  mark( A.positionAtTrueAnomaly( search_space_1[0] ), 4, primary_initial_pos );
//  mark( A.positionAtTrueAnomaly( search_space_1[1] ), 4, primary_initial_pos );
//  mark( A.positionAtTrueAnomaly( search_space_2[0] ), 4, primary_initial_pos );
//  mark( A.positionAtTrueAnomaly( search_space_2[1] ), 4, primary_initial_pos );
//  console.log( search_space_1[0]*R2D, search_space_1[1]*R2D, search_space_2[0]*R2D, search_space_2[1]*R2D );
  
  function f(angle) {
    var b_ang = normalize_angle(angle + (Aaop - Baop));
//    mark(A.positionAtTrueAnomaly( angle ), 1, primary_initial_pos);
//    mark(B.positionAtTrueAnomaly( b_ang ), 1, primary_initial_pos);
//    console.log( normalize_angle(angle) * R2D, b_ang * R2D, B.radiusAtTrueAnomaly( angle ) - A.radiusAtTrueAnomaly( b_ang ) );
    return A.radiusAtTrueAnomaly( angle ) - B.radiusAtTrueAnomaly( b_ang );
  }
  
  var results = [];
  
  function calculate_crossing( search_space ) {
    var angl;
    if( Math.abs(search_space[0] - search_space[1]) > 1e-10 ) {
      angl = roots.brentsMethod(search_space[0], search_space[1], .00001, f );
    } else {
      angl = search_space[0];
    }
    if( angl || angl === 0 ) {
      results.push( {
        orbits: [
          A,
          B,
        ],
        true_anomalies: [
          normalize_angle(angl),
          normalize_angle(angl + (Aaop - Baop)),
        ],
        positions: [
          A.positionAtTrueAnomaly( angl ),
          B.positionAtTrueAnomaly( normalize_angle(angl + (Aaop - Baop)) ),
        ],
      });
    }
  }
  calculate_crossing( search_space_1 );
  calculate_crossing( search_space_2 );
  
  canvas.save();
  canvas.strokeStyle = 'lime';
  if( results.length >= 1 ) {
    mark(results[0].positions[0], 2, primary_initial_pos);
  }
  if( results.length >= 2 ) {
    mark(results[1].positions[0], 2, primary_initial_pos);
  }
  canvas.restore();
  
  
  return results;
}

function normalize_angle( a ) {
  var PI2 = 2 * Math.PI;
  var r = a % PI2
  if( r < 0 ) r += PI2;
  return r;
}

orbit_intersections( orbit_flyby, CelestialBody.Duna.orbit );

function show_crossings( time ){
  var siblings = orbit_flyby.referenceBody.children();
  var crossings = {};
  for( var i in siblings ){
    var x = orbit_intersections( orbit_flyby, siblings[i].orbit, time );
    if( x.length > 0 ) {
      crossings[i] = {crossings: x};
    }
  }
  return crossings;
}
    
    
function fix_transfer_orbit_timing( transfer_orbit, destination_body_name, time_of_crossing ) {
  //console.log("destination_body_name", destination_body_name);
  //console.log("time_of_crossing", time_of_crossing);
  //console.trace("fix_transfer_orbit_timing A", transfer_orbit.trueAnomalyAt(time_of_crossing) );
  var k1 = CelestialBody[destination_body_name].orbit.positionAt( time_of_crossing );
  //console.log("positionAt time_of_crossing", k1);
  var ta_flyby = transfer_orbit.trueAnomalyAtPosition(k1);
  var time_flyby = transfer_orbit.timeAtTrueAnomaly(ta_flyby);
  //console.log("ta_flyby", ta_flyby);
  //console.log("time_flyby", time_flyby);
  var flyby_mean_anomaly_at_epoch = transfer_orbit.meanAnomalyAt(time_flyby - time_of_crossing);
  transfer_orbit.meanAnomalyAtEpoch = flyby_mean_anomaly_at_epoch;
//  console.log( "transfer_orbit.meanAnomalyAtEpoch", transfer_orbit.meanAnomalyAtEpoch );
  transfer_orbit.timeOfPeriapsisPassage = undefined;
  //console.trace("fix_transfer_orbit_timing B", transfer_orbit.trueAnomalyAt(time_of_crossing) );
}
//fix_transfer_orbit_timing( orbit_flyby, primary_mission.destinationBody, primary_mission.arrivalTime );



function calculate_flyby_encounter_corrections(k){
  if(!k) k = show_crossings(primary_mission.arrivalTime);
  $('#flyby-encounters').html(null);
  fix_transfer_orbit_timing( orbit_flyby, primary_mission.destinationBody, primary_mission.arrivalTime );
  var p = orbit_flyby.period();
  var t1 = primary_mission.arrivalTime % p;
  
  function pick_best_burn( crossings, body_name, times_around ){
    var ti = primary_mission.arrivalTime + p * times_around;
    function bar(crossing){
      var t2 = orbit_flyby.timeAtTrueAnomaly(crossing.true_anomalies[0]);
      if( t2 < t1 ) t2 += p;
      var td = t2 - t1;
      return Orbit.courseCorrection(orbit_flyby, CelestialBody[body_name].orbit, ti, ti + td);
    }
    
    var burn1, burn2;
    burn1 = burn2 = bar(crossings[0]);
    if( crossings.length > 1 )
      burn2 = bar(crossings[1]);
    return burn1.deltaV < burn2.deltaV ? burn1 : burn2;
  }
  
  var last_body_name = null;
  var $row = $("<div class='row'>");
  $('#flyby-encounters').append($row);
  var count_cells = 0;
  for( var body_name in k ){
    var crossings = k[body_name];
    var $span = $("<div class='col-sm-3'>");
    $row.append($span);
    count_cells++;
    crossings.burns = [];
    for( var j = 0; j < 10; ++j ){
      var burn = pick_best_burn(crossings.crossings, body_name, j);
      crossings.burns.push( burn );
      if( burn.deltaV <= 1000 ) {
        var dv = (burn.deltaV * 10 + 0.5 |0)/10;
        if(dv > 99) dv = dv |0;
        //console.log( body_name + "["+i+", "+j+"] " + burn.deltaV, burn );
        var flight_time = new KerbalTime( burn.arrivalTime - primary_mission.arrivalTime );
        $span.append("<div title='Time of flight: " + flight_time.toDurationString() + "'>" + body_name + " (+" + j + ") " + dv);
      }
    }
    if( (count_cells % 4) == 0 ) {
      $row = $("<div class='row'>");
      $('#flyby-encounters').append($row);
    }
  }

  return k;
}