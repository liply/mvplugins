// @flow

declare var Bitmap;
declare var ImageManager;

export interface BaseCommand {
    x: number;
    y: number;
    width: ?number;
    height: ?number;
}

export interface PictureCommand extends BaseCommand {
    picture: string;
    type: 'picture';
}

export interface LabelCommand extends BaseCommand {
    text: string;
    align: ?string;
    type: 'label';
}

export type RenderingCommands = PictureCommand | LabelCommand;

export default function renderCommands(target: Bitmap, commands: Array<RenderingCommands>){
    if(!commands)return true;

    let bitmaps = {};
    let notReady = false;
    commands.forEach(command=>{
        switch(command.type){
            case 'picture':
                let bitmap = ImageManager.loadPicture(command.picture);
                notReady = !bitmap.isReady() || notReady;
                bitmaps[command.picture] = bitmap;
        }
    });

    if(notReady)return false;

    target.clear();
    commands.forEach(command=>{
        switch(command.type){
            case 'picture':
                let bitmap = bitmaps[command.picture];
                target.blt(
                    bitmap, 0, 0, bitmap.width, bitmap.height,
                    command.x, command.y,
                    command.width || bitmap.width,
                    command.height || bitmap.height
                    );
                break;

            case 'label':
                target.drawText(command.text, command.x, command.y,
                    command.width || target.measureTextWidth(command.text),
                    command.height || target.fontSize,
                    command.align
                );
                break;
        }
    });

    return true;
}