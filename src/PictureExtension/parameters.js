
const PLUGIN_NAME = 'liply_PictureExtension';
const parameters = PluginManager.parameters(PLUGIN_NAME);

export default {
    PLUGIN_NAME,
    column: +parameters['Grid Column'],
    row: +parameters['Grid Row']
};