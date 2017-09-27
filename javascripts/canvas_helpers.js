var canvas_helpers = {};
(function(ns){
  "use strict";

  /**
   * Adds ctx.getTransform() - returns an SVGMatrix
   * Adds ctx.transformedPoint(x,y) - returns an SVGPoint
   * @param   {Object} ctx    canvas context
   */
  function track_transforms_SVG( ctx ) {
    if( ctx.transformedPoint ) return;

    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){ return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
      savedTransforms.push(xform.translate(0,0));
      return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
      xform = savedTransforms.pop();
      var ret = restore.call(ctx);
      ctx._syncTransforms();
      return ret;
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
      xform = xform.scaleNonUniform(sx,sy);
      return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
      xform = xform.rotate(radians*180/Math.PI);
      return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
      xform = xform.translate(dx,dy);
      return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
      var m2 = svg.createSVGMatrix();
      m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
      xform = xform.multiply(m2);
      return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
      pt.x=x; pt.y=y;
      return pt.matrixTransform(xform.inverse());
    }
    
    ctx._syncTransforms = function() {
      var t = xform;
      setTransform.call(ctx, t.a, t.b, t.c, t.d, t.e, t.f);
    }
  }
  
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  
  /**
   * [[Description]]
   * @param   {Object} ctx [[Description]]
   * @returns {Object} [[Description]]
   */
  function track_transforms_mine( ctx ) {
    if( ctx.transformedPoint ) return;

    var xform = matrix.identity(3);
    ctx.getTransform = function(){
      var t = xform;
      return {
        a: t[0][0],
        b: t[1][0],
        c: t[0][1],
        d: t[1][1],
        e: t[0][2],
        f: t[1][2],
      }; 
    };

    ctx.getTransformMatrix = function(){
      return xform;
    };
    ctx.setTransformMatrix = function(m){
      xform = matrix.translate(m,0,0)
      ctx._syncTransforms();
    };
    
    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
      savedTransforms.push(matrix.translate(xform,0,0));
      return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
      xform = savedTransforms.pop();
      var ret = restore.call(ctx);
      ctx._syncTransforms();
      return ret;
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
      xform = matrix.scale(xform,sx,sy);
      return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
      xform = matrix.rotate(xform,radians);
      return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
      xform = matrix.translate(xform,dx,dy);
      return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
      var m2 = matrix.identity(3);
      m2[0][0] = a;
      m2[1][0] = b;
      m2[0][1] = c;
      m2[1][1] = d;
      m2[0][2] = e;
      m2[1][2] = f;
      xform = matrix.multiply(xform,m2);
      return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
      var m2 = matrix.identity(3);
      m2[0][0] = a;
      m2[1][0] = b;
      m2[0][1] = c;
      m2[1][1] = d;
      m2[0][2] = e;
      m2[1][2] = f;
      xform = m2;
      return setTransform.call(ctx,a,b,c,d,e,f);
    };
    
    ctx.transformedPoint = function(x,y){
      var mi = matrix.inverse(xform);
      return matrix.transformPoint(mi, x, y);
    }
    
    ctx._syncTransforms = function() {
      var t = ctx.getTransform();
      setTransform.call(ctx, t.a, t.b, t.c, t.d, t.e, t.f);
    }
  }
  
  /**
   * Enables mouse wheel zooming and mouse drag panning.
   *
   * Source: http://phrogz.net/tmp/canvas_zoom_to_cursor.html
   * @param   {Object}   canvas_dom
   * @param   {Object}   canvas_context
   * @param   {Function} redraw  callback to redraw when needed
   */
  function enable_mouse_zoom( canvas_dom, canvas_context, redraw ){
    track_transforms_mine( canvas_context );
    var redraw_ = redraw;
    var lastX=canvas_dom.width/2, lastY=canvas_dom.height/2;
    var dragStart,dragged;
    canvas_dom.addEventListener('mousedown',function(evt){
      canvas_context.logon = true;
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
      lastX = evt.offsetX || (evt.pageX - canvas_dom.offsetLeft);
      lastY = evt.offsetY || (evt.pageY - canvas_dom.offsetTop);
      dragStart = canvas_context.transformedPoint(lastX,lastY);
      dragged = false;
      canvas_context.logon = false;
    },false);
    canvas_dom.addEventListener('mousemove',function(evt){
      canvas_context.logon = true;
      lastX = evt.offsetX || (evt.pageX - canvas_dom.offsetLeft);
      lastY = evt.offsetY || (evt.pageY - canvas_dom.offsetTop);
      dragged = true;
      if (dragStart){
        var pt = canvas_context.transformedPoint(lastX,lastY);
        canvas_context.translate(pt.x-dragStart.x,pt.y-dragStart.y);
        canvas_context._syncTransforms();
        canvas_context.logon = false;
        if( redraw_ ) redraw_();
      }
      canvas_context.logon = false;
    },false);
    canvas_dom.addEventListener('mouseup',function(evt){
      dragStart = null;
      // mouse click zooming
      // if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
    },false);

    var scaleFactor = 1.1;
    var zoom = function(clicks){
      canvas_context.logon = true;
      var pt = canvas_context.transformedPoint(lastX,lastY);
      canvas_context.translate(pt.x,pt.y);
      var factor = Math.pow(scaleFactor,clicks);
      canvas_context.scale(factor,factor);
      canvas_context.translate(-pt.x,-pt.y);
      canvas_context._syncTransforms();
      canvas_context.logon = false;
      if( redraw_ ) redraw_();
    }

    var handleScroll = function(evt){
      var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
      if (delta) zoom(delta);
      return evt.preventDefault() && false;
    };
    canvas_dom.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas_dom.addEventListener('mousewheel',handleScroll,false);
  }
  
  ns.enable_mouse_zoom = enable_mouse_zoom;
  ns.track_transforms = track_transforms_mine;
//  ns.trap_transforms = trap_transforms;
})(canvas_helpers);

