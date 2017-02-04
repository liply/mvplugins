// @flow

export const TYPE_POINT = 1;
export const TYPE_CONE = 2;

function generateFragmentShader(numPoints: number, numCones: number){
    //pointLights: x, y, r1, r2
    //coneLights: x, y, r1, r2
    //coneSetups: ux, uy, angleMin(cos), angleMax(cos)
    numPoints = numPoints || 1;
    numCones = numCones || 1;

    return `
precision highp float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;

uniform vec4 u_pointLights[${numPoints}];
uniform vec4 u_pointColors[${numPoints}];

uniform vec4 u_coneLights[${numCones}];
uniform vec4 u_coneSetups[${numCones}];
uniform vec4 u_coneColors[${numCones}];

uniform vec4 u_ambientColor; 

float calcPointLightPower(vec4 p){
    float l = length(p.xy - gl_FragCoord.xy);
    
    return 1.0 - smoothstep(0.0, p.z+p.w, l);
}

float calcConeBasePower(vec4 p){
    float l = length(p.xy - gl_FragCoord.xy);

    float a = -1.0 / (p.w - p.z);
    float b = -a * p.w;
    
    return clamp(a*l+b, 0.0, 1.0);
}

float calcConeLightPower(vec4 p, vec4 s){
    vec2 unit = normalize(gl_FragCoord.xy - p.xy);
    float u = dot(unit, s.xy);

    return calcPointLightPower(p) * clamp(smoothstep(s.w, s.z, u), 0.0, 1.0);
}


vec4 applyLight(vec4 color){
    vec4 light = vec4(0.0, 0.0, 0.0, 1.0);
    for(int n = 0; n < ${numPoints}; ++n){
        light += calcPointLightPower(u_pointLights[n]) * u_pointColors[n];
    }
    
    for(int n = 0; n < ${numCones}; ++n){
        light += calcConeLightPower(u_coneLights[n], u_coneSetups[n]) * u_coneColors[n];
    }
    
    return clamp(light+u_ambientColor, vec4(0.0), vec4(1.0)) * color;
}

void main(){
    gl_FragColor = applyLight(texture2D(uSampler, vTextureCoord));
}
`;
}

declare var PIXI;

export class LightFilter extends PIXI.Filter{
    constructor(numPoints: number, numCones: number){
        super(null, generateFragmentShader(numPoints, numCones));
    }

    setLight(num: number, x: number, y: number, r1: number, r2: number, r: number, g: number, b: number){
        const lights = this.uniforms.u_pointLights;
        const colors = this.uniforms.u_pointColors;
        const i = num*4;
        lights[i+0] = x;
        lights[i+1] = y;
        lights[i+2] = r1;
        lights[i+3] = (r2-r1)*Math.random();

        colors[i+0] = r;
        colors[i+1] = g;
        colors[i+2] = b;
        colors[i+3] = 1.0;

        this.uniforms.u_pointLights = lights;
        this.uniforms.u_pointColors = colors;
    }

    setCone(num: number, x: number, y: number,
            r1: number, r2: number,
            ux: number, uy: number,
            angleMin: number, angleMax: number,
            r: number, g: number, b: number){
        const lights = this.uniforms.u_coneLights;
        const setups = this.uniforms.u_coneSetups;
        const colors = this.uniforms.u_coneColors;
        const i = num*4;
        lights[i+0] = x;
        lights[i+1] = y;
        lights[i+2] = r1;
        lights[i+3] = (r2-r1)*Math.random();

        setups[i+0] = ux;
        setups[i+1] = uy;
        setups[i+2] = Math.cos(angleMin);
        setups[i+3] = Math.cos(angleMax);

        colors[i+0] = r;
        colors[i+1] = g;
        colors[i+2] = b;
        colors[i+3] = 1.0;

        this.uniforms.u_coneLights = lights;
        this.uniforms.u_coneColors = colors;
        this.uniforms.u_coneSetups = setups;
    }

    setAmbient(r: number,g: number,b: number){
        const color = this.uniforms.u_ambientColor;
        color[0] = r;
        color[1] = g;
        color[2] = b;
        color[3] = 1;
        this.uniforms.u_ambientColor = color;
    }
}