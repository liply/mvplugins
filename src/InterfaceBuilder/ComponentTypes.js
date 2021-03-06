// @flow

import type {RenderingCommands} from './RenderingCommands.js'

export interface Base{
    id: string;
    parentId: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    width: number;
    height: number;

    [key: string]: any;
}

export interface NodeType{
    addChild: (Base)=>any;
    removeChild: (Base)=>any;
}

export interface Anchor{
    anchorX: number;
    anchorY: number;
}

export interface BaseSpriteType extends Base, Anchor{}

export interface ContainerType extends BaseSpriteType{
    type: 'Container';
}

export interface PictureType extends BaseSpriteType{
    type: 'Picture';
    picture: string;
}

export interface TextType extends BaseSpriteType{
    type: 'Text';
    text: string;
}

export interface WindowType extends Base{
    type: 'Window';
    commands: Array<RenderingCommands>;
}

export interface CanvasType extends BaseSpriteType{
    type: 'Canvas';
    commands: Array<RenderingCommands>;
}

export interface SpriteType extends BaseSpriteType{
    type: 'Sprite';
}

export type Any = ContainerType | PictureType | TextType | WindowType | SpriteType | CanvasType;