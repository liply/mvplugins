
const PLUGIN_NAME = 'liply_ShaderLight';
const parameters = PluginManager.parameters(PLUGIN_NAME);

export default {
    PLUGIN_NAME,
    ambientColor: parameters['Ambient Color'],
    playerRadius: +parameters['Player Radius'],
    playerConeRadius: +parameters['Player Cone Radius'],
    playerColor: parameters['Player Color'],
    playerAngleMin: +parameters['Player AngleMin'],
    playerAngleMax: +parameters['Player AngleMax'],
    playerLightType: parameters['Player Light Type'].split(',').map(p=>p.toLowerCase())
};