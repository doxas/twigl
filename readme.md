
# twigl

twigl.app is an online editor for One tweet shader, with gif generator and sound shader, and broadcast live coding.

<div style="width: 100%; text-align: center;">
    <img src="./resource/ogp.png" style="max-width: 100%;">
</div>

## get started

```
$ npm install
$ npm start
```

## screen shot

<div style="width: 100%; text-align: center;">
    <img src="./resource/capture-01.jpg" style="max-width: 100%; margin: 30px auto; display: block;">
    <img src="./resource/capture-02.jpg" style="max-width: 100%; margin: 30px auto; display: block;">
    <img src="./resource/capture-03.jpg" style="max-width: 100%; margin: 30px auto; display: block;">
    <img src="./resource/capture.gif" style="max-width: 100%; margin: 30px auto; display: block;">
</div>

Example:

```glsl
precision highp float;
uniform float time;
void main(){vec4 p=vec4((gl_FragCoord.xy/4e2),0,-4);for(int i=0;i<9;++i)p+=vec4(sin(-(p.x+time*.2))+atan(p.y*p.w),cos(-p.x)+atan(p.z*p.w),cos(-(p.x+sin(time*.8)))+atan(p.z*p.w),0);gl_FragColor=p;}
```

Live: <a href="https://bit.ly/3aBelvb" target="_blank">DEMO</a>

## credit

[spite/ccapture\.js: A library to capture canvas\-based animations at a fixed framerate](https://github.com/spite/ccapture.js)

[jnordberg/gif\.js: JavaScript GIF encoding library](https://github.com/jnordberg/gif.js)

[Ace \- The High Performance Code Editor for the Web](https://ace.c9.io/)

[Shadertoy BETA](https://www.shadertoy.com/)

interface design by [@iY0Yi](https://twitter.com/iY0Yi)

## license

MIT licensed.

